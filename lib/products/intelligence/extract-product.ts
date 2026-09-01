import { prisma } from "@/lib/db/client"
import { assessCompleteness } from "@/lib/products/completeness"
import { extractProductAttributes } from "@/lib/products/enrich/extract"
import { toEnrichmentUpdate } from "@/lib/products/enrich/normalize"
import {
  DailyQuotaExhausted,
  withRateLimitRetry,
} from "@/lib/products/enrich/rate-limit"
import { sourceHash } from "@/lib/products/ingest/source-hash"
import { statusForOutcome } from "@/lib/products/intelligence/eligibility"
import { parseInciList } from "@/lib/products/parse-inci"

/**
 * Extract one product's intelligence, whatever it came from.
 *
 * The single convergence point the architecture depends on. A manually entered
 * product and a WooCommerce one both arrive here; nothing downstream can tell
 * which, and there is deliberately no second implementation for either. The
 * only difference between them is how the row got into the database.
 *
 * Gemini reads one product's own description and reports what that product is.
 * It is never shown a user, a scan, or the rest of the catalogue, so it has
 * nothing to express a preference between — this is extraction, not
 * recommendation, and the two are different responsibilities.
 *
 * There is no background job queue in this application. This runs inline on the
 * server, in whichever action calls it, and the caller waits. That is a real
 * limitation and is stated rather than disguised: a product creation blocks for
 * the length of one model call. What it never does is take the product down
 * with it — persistence and extraction are separate steps, and a failure here
 * leaves a saved product with a recorded reason and a retry available.
 */

export const DEFAULT_EXTRACTION_MODEL = "gemini-2.5-flash"

export function extractionModelId(): string {
  return process.env.PRODUCT_ENRICHMENT_MODEL?.trim() || DEFAULT_EXTRACTION_MODEL
}

export type ExtractProductResult =
  | {
      ok: true
      status: "extracted" | "needs_review"
      completenessScore: number
      missing: string[]
      classification: string | null
    }
  | { ok: false; status: "failed"; error: string }
  | { ok: false; status: "skipped"; reason: string }

/**
 * Runs extraction for one product and records the outcome.
 *
 * Idempotent by status. A product already being extracted is skipped rather
 * than extracted twice, so a refreshed page or a double-submitted form cannot
 * start a second model call for the same row. An explicit retry passes `force`,
 * which is the difference between "this happened again by accident" and "the
 * administrator asked for it".
 */
export async function extractProductIntelligence(
  productId: string,
  options: { force?: boolean; modelId?: string } = {},
): Promise<ExtractProductResult> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
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
      intelligenceStatus: true,
    },
  })

  if (!product) {
    return { ok: false, status: "skipped", reason: "Product not found" }
  }

  if (product.intelligenceStatus === "extracting" && !options.force) {
    return {
      ok: false,
      status: "skipped",
      reason: "An extraction is already running for this product",
    }
  }

  // Kept so a quota stop can put it back: an extraction that never ran must not
  // leave the product looking mid-flight.
  const previousStatus = product.intelligenceStatus

  // Claimed before the model call so a concurrent request sees it. Not a lock —
  // two simultaneous calls could still both read `pending` — but it closes the
  // ordinary case of a refreshed page, and the cost of the rare double
  // extraction is a duplicate model call, not corrupted data.
  await prisma.product.update({
    where: { id: product.id },
    data: { intelligenceStatus: "extracting", intelligenceError: null },
  })

  try {
    const { extraction } = await withRateLimitRetry(() =>
      extractProductAttributes(
        {
          slug: product.id,
          name: product.name,
          description: product.description,
          category: product.category,
          ingredients: product.ingredients,
        },
        options.modelId ?? extractionModelId(),
      ),
    )

    const update = toEnrichmentUpdate(extraction, {
      brand: product.brand,
      targetConcerns: product.targetConcerns,
      primaryClassification: product.primaryClassification,
    })

    const parsed = parseInciList(product.ingredients ?? "")
    const ingredientList = [
      ...new Set([
        ...product.ingredientList,
        ...(parsed.isLikelyInciList ? parsed.items : []),
        ...extraction.keyIngredients.map((item) => item.trim()).filter(Boolean),
      ]),
    ]

    const { score, missing } = assessCompleteness({
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

    const status = statusForOutcome({
      classified: update.primaryClassification !== null,
      completenessScore: score,
      missing,
    })

    await prisma.product.update({
      where: { id: product.id },
      data: {
        ...update,
        ingredientList,
        completenessScore: score,
        // Records what this intelligence was derived from, so a later sync can
        // tell whether the source text has moved on.
        sourceHash: sourceHash({
          name: product.name,
          description: product.description,
          category: product.category,
          ingredients: product.ingredients ?? undefined,
        }),
        intelligenceStale: false,
        intelligenceStatus: status,
        intelligenceError: null,
        intelligenceExtractedAt: new Date(),
      },
    })

    return {
      ok: true,
      status,
      completenessScore: score,
      missing,
      classification: update.primaryClassification,
    }
  } catch (err) {
    // A daily provider quota is an environmental limit, not a fact about this
    // product: the extraction never ran. Recording it as a failure blames the
    // row for a condition it did not cause, and on a catalogue pass it marks
    // every remaining product broken after one exhausted key. The status is put
    // back and the error is re-thrown so the caller can stop the whole run.
    if (err instanceof DailyQuotaExhausted) {
      await prisma.product.update({
        where: { id: product.id },
        data: { intelligenceStatus: previousStatus },
      })
      throw err
    }

    const message = err instanceof Error ? err.message : String(err)

    // The product stays exactly as it was saved. Only the extraction failed,
    // and the reason is recorded so an administrator can decide whether to
    // retry or fix the source data.
    await prisma.product.update({
      where: { id: product.id },
      data: {
        intelligenceStatus: "failed",
        intelligenceError: message.slice(0, 500),
      },
    })

    return { ok: false, status: "failed", error: message }
  }
}
