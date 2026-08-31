import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { revalidateCatalogContext } from "@/lib/ai/context/cache-tags"
import { prisma } from "@/lib/db/client"
import {
  fetchWooCommerceProducts,
  isWooCommerceConfigured,
} from "@/lib/products/ingest/woocommerce"
import { mapWooCommerceProduct } from "@/lib/products/ingest/map-woocommerce"
import { planSync, type ExistingProduct } from "@/lib/products/ingest/reconcile"
import { mapFallbackProduct, type FallbackProduct } from "@/lib/products/seed-map"
import type { ProductSource } from "@/generated/prisma/client"
import type {
  CatalogSyncResult,
  IngestProductInput,
} from "@/lib/products/ingest/types"

/**
 * Brings Aurora's catalogue into line with its source.
 *
 * WooCommerce is the ecommerce source of truth for what a product *is*: its
 * name, prose, price, image and stock. Aurora is the source of truth for what
 * the recommendation engine reads. This writes the first and deliberately does
 * not write the second — the intelligence columns are produced by the
 * extraction pass, and this only marks them stale when the text they were
 * derived from has changed.
 */

const __dirname = dirname(fileURLToPath(import.meta.url))
const fallbackPath = join(__dirname, "../../../scripts/data/products_fallback.json")

function loadFallbackProducts(): IngestProductInput[] {
  const raw = readFileSync(fallbackPath, "utf8")
  const items = JSON.parse(raw) as FallbackProduct[]

  return items.map((item) => {
    const mapped = mapFallbackProduct(item)
    return {
      source: "fallback" as const,
      // The seed file carries no store identifier, which is precisely why
      // these rows are adopted by slug on the first real sync rather than
      // duplicated. Inventing an id here would prevent that adoption.
      externalId: null,
      sku: mapped.sku,
      name: mapped.name,
      slug: mapped.slug,
      description: mapped.description,
      category: mapped.category,
      ingredients: mapped.ingredients,
      ingredientList: mapped.ingredientList,
      imageUrl: mapped.imageUrl,
      storeUrl: mapped.storeUrl,
      targetConcerns: mapped.targetConcerns,
      climateTags: mapped.climateTags,
      published: true,
    }
  })
}

/**
 * Which source a sync should read.
 *
 * `auto` uses the store when credentials are configured. `fallback` forces the
 * bundled seed file, which is how a development database is populated without
 * reaching the store at all — and the only way to exercise the write path when
 * the store is unreachable. It never silently substitutes for a failed store
 * call: a store that refuses a request is an error, not a reason to quietly
 * overwrite the catalogue with a seed file.
 */
export type SyncSourceMode = "auto" | "fallback"

function resolveSource(mode: SyncSourceMode): ProductSource {
  if (mode === "fallback") return "fallback"
  return isWooCommerceConfigured() ? "woocommerce" : "fallback"
}

async function loadIngestProducts(
  source: ProductSource,
): Promise<IngestProductInput[]> {
  if (source === "woocommerce") {
    const products = await fetchWooCommerceProducts()
    return products.map(mapWooCommerceProduct)
  }

  return loadFallbackProducts()
}

/** Source fields. Always written — the store owns these. */
function sourceData(input: IngestProductInput) {
  return {
    sku: input.sku,
    name: input.name,
    description: input.description,
    category: input.category,
    ingredients: input.ingredients ?? null,
    imageUrl: input.imageUrl ?? null,
    storeUrl: input.storeUrl ?? null,
    priceCents: input.priceCents ?? null,
    ...(input.currency ? { currency: input.currency } : {}),
    availability: input.availability ?? "unknown",
    sourceUpdatedAt: input.sourceUpdatedAt ?? null,
    externalId: input.externalId,
    source: input.source,
    lastSyncedAt: new Date(),
    // Unpublished upstream means inactive here, not gone. A product returning
    // to `publish` recovers this row and its recommendation history.
    isActive: input.published !== false,
  }
}

/**
 * Derived fields the sync may write.
 *
 * Only the two the source genuinely supports — concerns and climate hints read
 * off the merchant's own tags — and only for products no person has confirmed.
 * Classification, skin types, benefits and routine position are never written
 * here: nothing in a WooCommerce payload establishes them, and writing a guess
 * would make an inference indistinguishable from a fact.
 */
function derivedData(input: IngestProductInput) {
  return {
    targetConcerns: input.targetConcerns,
    climateTags: input.climateTags,
    ingredientList: input.ingredientList,
  }
}

export async function syncProductCatalog(
  createdById: string,
  mode: SyncSourceMode = "auto",
): Promise<CatalogSyncResult> {
  const source = resolveSource(mode)

  const run = await prisma.productSyncRun.create({
    data: { source, status: "running", actorId: createdById },
  })

  const result: CatalogSyncResult = {
    source,
    runId: run.id,
    discovered: 0,
    created: 0,
    updated: 0,
    unchanged: 0,
    archived: 0,
    markedStale: 0,
    failed: 0,
  }

  try {
    const inputs = await loadIngestProducts(source)
    result.discovered = inputs.length

    // Aurora's own catalogue only. A clinic's products are its own and are
    // never touched by a store sync.
    const existingRows = await prisma.product.findMany({
      where: { organizationId: null },
      select: {
        id: true,
        source: true,
        externalId: true,
        slug: true,
        sku: true,
        sourceHash: true,
        verificationStatus: true,
      },
    })

    const existing: ExistingProduct[] = existingRows.map((row) => ({
      id: row.id,
      source: row.source,
      externalId: row.externalId,
      slug: row.slug,
      sku: row.sku,
      sourceHash: row.sourceHash,
      verified: row.verificationStatus === "confirmed",
    }))

    const plan = planSync(inputs, existing)

    for (const action of plan.actions) {
      try {
        if (action.kind === "unchanged") {
          await prisma.product.update({
            where: { id: action.id },
            data: { lastSyncedAt: new Date() },
          })
          result.unchanged += 1
          continue
        }

        if (action.kind === "create") {
          await prisma.product.create({
            data: {
              ...sourceData(action.input),
              ...derivedData(action.input),
              slug: action.input.slug,
              sourceHash: action.hash,
              // A product Aurora has never assessed is not yet intelligible to
              // the engine, so it arrives stale and awaits extraction.
              intelligenceStale: true,
              createdById,
            },
          })
          result.created += 1
          continue
        }

        await prisma.product.update({
          where: { id: action.id },
          data: {
            ...sourceData(action.input),
            ...(action.mayWriteDerived ? derivedData(action.input) : {}),
            sourceHash: action.hash,
            ...(action.markStale ? { intelligenceStale: true } : {}),
          },
        })
        result.updated += 1
        if (action.markStale) result.markedStale += 1
      } catch (err) {
        result.failed += 1
        result.error ??= err instanceof Error ? err.message : String(err)
      }
    }

    if (plan.missingIds.length > 0) {
      // Archived, never deleted. A recommendation made last month names a
      // product by slug and must keep resolving.
      const archived = await prisma.product.updateMany({
        where: { id: { in: plan.missingIds } },
        data: { isActive: false, availability: "discontinued" },
      })
      result.archived = archived.count
    }

    await prisma.productSyncRun.update({
      where: { id: run.id },
      data: {
        status: result.failed > 0 ? "failed" : "succeeded",
        finishedAt: new Date(),
        discovered: result.discovered,
        created: result.created,
        updated: result.updated,
        unchanged: result.unchanged,
        archived: result.archived,
        markedStale: result.markedStale,
        failed: result.failed,
        error: result.error ?? null,
      },
    })

    // revalidateTag needs the static generation store, which a CLI run has no
    // access to. Swallowed rather than thrown, and deliberately after the run
    // row is finalised: an unguarded call here threw past the success update
    // into the outer catch, which then rewrote a completed sync as failed.
    // Failing to clear a cache must never rewrite the record of what happened.
    try {
      revalidateCatalogContext()
    } catch {
      console.warn(
        "[sync] Catalogue cache not invalidated (no request context)." +
          " A running server refreshes within its revalidate window.",
      )
    }

    return result
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await prisma.productSyncRun.update({
      where: { id: run.id },
      data: { status: "failed", finishedAt: new Date(), error: message },
    })
    throw err
  }
}

export async function getCatalogSyncSourceLabel(): Promise<string> {
  return isWooCommerceConfigured() ? "woocommerce" : "fallback"
}
