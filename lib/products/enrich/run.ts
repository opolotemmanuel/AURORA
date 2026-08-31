import { revalidateCatalogContext } from "@/lib/ai/context/cache-tags"
import { prisma } from "@/lib/db/client"
import { assessCompleteness } from "@/lib/products/completeness"
import { extractProductAttributes } from "@/lib/products/enrich/extract"
import { toEnrichmentUpdate } from "@/lib/products/enrich/normalize"
import {
  DailyQuotaExhausted,
  withRateLimitRetry,
} from "@/lib/products/enrich/rate-limit"
import { sourceHash } from "@/lib/products/ingest/source-hash"
import { parseInciList } from "@/lib/products/parse-inci"

/**
 * Runs the extraction pass across the catalogue and writes what it finds.
 *
 * Sequential rather than parallel. Twenty-four products is not worth a rate
 * limit, and a partial failure that leaves half the catalogue enriched is much
 * easier to reason about when the order is deterministic.
 */

export type EnrichOneOutcome = {
  slug: string
  completenessBefore: number
  completenessAfter: number
  classification: string | null
  routineCategory: string | null
  keyIngredientsFound: number
  error?: string
}

export type EnrichCatalogueOptions = {
  modelId: string
  /** Enrich only these slugs. Omit for the whole catalogue. */
  slugs?: string[]
  /** Re-enrich products that already have a classification. */
  force?: boolean
  /** Write nothing; report what would change. */
  dryRun?: boolean
  /**
   * Pause between products, in milliseconds.
   *
   * The Gemini free tier allows five requests a minute, so the default paces
   * just inside that. Raising throughput is a matter of a paid key, not of
   * removing this.
   */
  delayMs?: number
  onProgress?: (outcome: EnrichOneOutcome) => void
}

/** Products the pass never reached, so a resumed run knows where to start. */
export type EnrichCatalogueResult = {
  outcomes: EnrichOneOutcome[]
  /** Set when a daily quota stopped the run early. */
  stoppedEarly: boolean
  remainingSlugs: string[]
}

const DEFAULT_DELAY_MS = 13_000

export async function enrichCatalogue(
  options: EnrichCatalogueOptions,
): Promise<EnrichCatalogueResult> {
  const products = await prisma.product.findMany({
    where: {
      ...(options.slugs?.length ? { slug: { in: options.slugs } } : {}),
      // Re-running must be cheap and safe. Without `force` this takes the
      // products that need extraction — never classified, or classified from
      // source text that has since changed — so an interrupted pass can be run
      // again without paying for the whole catalogue twice.
      ...(options.force
        ? {}
        : { OR: [{ primaryClassification: null }, { intelligenceStale: true }] }),
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      category: true,
      ingredients: true,
      ingredientList: true,
      brand: true,
      targetConcerns: true,
      primaryClassification: true,
      imageUrl: true,
      priceCents: true,
      completenessScore: true,
    },
  })

  const outcomes: EnrichOneOutcome[] = []
  const delayMs = options.delayMs ?? DEFAULT_DELAY_MS
  let stoppedEarly = false
  let index = 0

  for (const product of products) {
    // Pace between products, not before the first one.
    if (index > 0 && delayMs > 0 && !options.dryRun) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
    index += 1

    try {
      const { extraction } = await withRateLimitRetry(() =>
        extractProductAttributes(
          {
            slug: product.slug,
            name: product.name,
            description: product.description,
            category: product.category,
            ingredients: product.ingredients,
          },
          options.modelId,
        ),
      )

      const update = toEnrichmentUpdate(extraction, {
        brand: product.brand,
        targetConcerns: product.targetConcerns,
        primaryClassification: product.primaryClassification,
      })

      // Ingredient names the description mentions are folded into the parsed
      // INCI list, so the join step downstream has something to match on for
      // the twenty-two products whose supplier gave no ingredient text at all.
      const parsed = parseInciList(product.ingredients ?? "")
      const ingredientList = [
        ...new Set([
          ...product.ingredientList,
          ...(parsed.isLikelyInciList ? parsed.items : []),
          ...extraction.keyIngredients.map((item) => item.trim()).filter(Boolean),
        ]),
      ]

      const { score } = assessCompleteness({
        name: product.name,
        description: product.description,
        brand: update.brand,
        imageUrl: product.imageUrl,
        primaryClassification: update.primaryClassification,
        targetConcerns: update.targetConcerns,
        suitableSkinTypes: update.suitableSkinTypes,
        cosmeticBenefits: update.cosmeticBenefits,
        climateTags: update.climateTags,
        ingredients: ingredientList.join(", "),
        routineCategory: update.routineCategory,
        priceCents: product.priceCents,
      })

      if (!options.dryRun) {
        await prisma.product.update({
          where: { id: product.id },
          data: {
            ...update,
            ingredientList,
            completenessScore: score,
            // Records what this intelligence was derived from, and clears the
            // stale flag. Without the hash a later sync cannot tell whether the
            // source text has moved on, so every sync would re-extract every
            // product — the cost this flag exists to avoid.
            sourceHash: sourceHash({
              name: product.name,
              description: product.description,
              category: product.category,
              ingredients: product.ingredients ?? undefined,
            }),
            intelligenceStale: false,
          },
        })
      }

      const outcome: EnrichOneOutcome = {
        slug: product.slug,
        completenessBefore: product.completenessScore,
        completenessAfter: score,
        classification: update.primaryClassification,
        routineCategory: update.routineCategory,
        keyIngredientsFound: extraction.keyIngredients.length,
      }
      outcomes.push(outcome)
      options.onProgress?.(outcome)
    } catch (err) {
      // A daily cap will not clear during this run. Stopping keeps the report
      // honest — "18 done, 6 not reached" — instead of burying one real cause
      // under six identical failures.
      if (err instanceof DailyQuotaExhausted) {
        stoppedEarly = true
        break
      }

      const outcome: EnrichOneOutcome = {
        slug: product.slug,
        completenessBefore: product.completenessScore,
        completenessAfter: product.completenessScore,
        classification: null,
        routineCategory: null,
        keyIngredientsFound: 0,
        error: err instanceof Error ? err.message : String(err),
      }
      outcomes.push(outcome)
      options.onProgress?.(outcome)
    }
  }

  const done = new Set(outcomes.map((o) => o.slug))
  const remainingSlugs = products
    .map((p) => p.slug)
    .filter((slug) => !done.has(slug))

  if (!options.dryRun && outcomes.some((o) => !o.error)) {
    // revalidateTag needs the static generation store, which a CLI run has no
    // access to. Failing to clear a cache must never discard writes that
    // already succeeded, so this is reported and swallowed rather than thrown:
    // a script run has no server holding a stale cache anyway, and a running
    // server picks the change up within CATALOG_CACHE_REVALIDATE_SECONDS.
    try {
      revalidateCatalogContext()
    } catch {
      console.warn(
        "[enrich] Catalogue cache not invalidated (no request context)." +
          " A running server refreshes within its revalidate window.",
      )
    }
  }

  return { outcomes, stoppedEarly, remainingSlugs }
}
