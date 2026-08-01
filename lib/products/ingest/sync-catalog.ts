// The actual WooCommerce -> Product sync. Uses raw `pg`, not Prisma Client —
// matching scripts/import_products.mjs and scripts/backfill-scan-credits.mjs's
// existing convention: Prisma's generated TS client (lib/generated/prisma/)
// uses extensionless internal imports that only resolve through a bundler
// (Next.js/tsc "bundler" moduleResolution), not through plain `node`, which
// is what scripts/sync-products.ts needs to run this standalone.
//
// Field-ownership split (confirmed with the product owner before building):
// - STORE-OWNED (overwritten from WooCommerce every run): name,
//   shortDescription, imagePath (downloaded from WooCommerce, never a raw
//   hotlink — see AGENTS.md's Image Rule), officialUrl.
// - `active` is store-owned only in one direction: this sync can turn a
//   product OFF (discontinued in the WooCommerce feed) but never forces it
//   back ON for a product that's still in the feed — several products were
//   deliberately deactivated by hand for business reasons unrelated to
//   WooCommerce status (see scripts/products_import.json).
// - CURATED (never touched after first import): category, routineStep,
//   priority, cosmeticBenefits, bestFor, avoidIf, doshaTags. A brand-new
//   WooCommerce-only product gets safe placeholders for these (never
//   fabricated content) plus needsCuration = true, and is created inactive
//   until a human finishes curating it.
// - keyIngredients is a partial exception, for NEW products only: this sync
//   runs parse-inci.ts against the raw WooCommerce description text and
//   recognizes whatever matches the real, curated Ingredient table (never
//   invents a match — see lib/products/ingredients/parse-inci.ts). Existing/
//   curated products' ingredients are never touched by this sync, same as
//   every other curated field above.
// - Products no longer in the WooCommerce feed are deactivated
//   (active = false), never hard-deleted — preserves Recommendation history.
import { writeFileSync, mkdirSync } from "node:fs"
import { extname } from "node:path"
import pg from "pg"

import { loadIngredientVocabulary } from "./ingredient-vocabulary.ts"
import { fetchWooCommerceProducts } from "./woocommerce.ts"
import { mapWooCommerceProduct, stripHtml } from "./map-woocommerce.ts"
import { parseIngredientsFromText } from "../ingredients/parse-inci.ts"
import type { CatalogSyncResult, FieldChange, ProductSyncPlan, WooCommerceProduct } from "./types.ts"

type ExistingProduct = {
  id: string
  slug: string
  name: string
  shortDescription: string
  imagePath: string | null
  officialUrl: string | null
  active: boolean
}

function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${Date.now().toString(36)}_${random}`
}

function imagePathFor(slug: string, imageUrl: string): string {
  const ext = extname(new URL(imageUrl).pathname) || ".jpg"
  return `/products/${slug}${ext}`
}

async function downloadProductImage(slug: string, imageUrl: string): Promise<void> {
  const imagePath = imagePathFor(slug, imageUrl)
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to download image for ${slug} (${response.status}): ${imageUrl}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  mkdirSync("public/products", { recursive: true })
  writeFileSync(`public${imagePath}`, buffer)
}

function diffStoreOwnedFields(
  existing: ExistingProduct,
  input: { name: string; shortDescription: string; officialUrl: string; imagePath: string | null },
): FieldChange[] {
  const changes: FieldChange[] = []

  if (existing.name !== input.name) {
    changes.push({ field: "name", from: existing.name, to: input.name })
  }
  if (existing.shortDescription !== input.shortDescription) {
    changes.push({ field: "shortDescription", from: existing.shortDescription, to: input.shortDescription })
  }
  if (existing.officialUrl !== input.officialUrl) {
    changes.push({ field: "officialUrl", from: existing.officialUrl, to: input.officialUrl })
  }
  if (input.imagePath !== null && existing.imagePath !== input.imagePath) {
    changes.push({ field: "imagePath", from: existing.imagePath, to: input.imagePath })
  }

  return changes
}

// The raw, un-truncated text parse-inci.ts scans for a new product — both
// description fields, HTML-stripped, concatenated. Deliberately not
// IngestProductInput's `shortDescription` (which falls back to a 500-char
// slice of the full description and can cut off an ingredient mentioned
// later in a long product description).
function ingredientSearchText(product: WooCommerceProduct): string {
  return `${stripHtml(product.short_description)} ${stripHtml(product.description)}`.trim()
}

export async function syncProductCatalog(
  connectionString: string,
  options: { dryRun: boolean },
): Promise<CatalogSyncResult> {
  const wooProducts = await fetchWooCommerceProducts()
  const mapped = wooProducts.map(mapWooCommerceProduct)
  const wooBySlug = new Map(wooProducts.map((product, index) => [mapped[index].slug, product]))
  const wooSlugs = new Set(mapped.map((product) => product.slug))

  const client = new pg.Client({ connectionString })
  await client.connect()

  try {
    const { rows: existingProducts } = await client.query<ExistingProduct>(
      `SELECT id, slug, name, "shortDescription", "imagePath", "officialUrl", active FROM "Product"`,
    )
    const existingBySlug = new Map(existingProducts.map((product) => [product.slug, product]))
    // Only ever read for `create` plans (new products) — existing/curated
    // products' ingredients are never touched by this sync, so this is a
    // no-op query cost for a run with no new products.
    const ingredientVocabulary = await loadIngredientVocabulary(client)

    const plans: ProductSyncPlan[] = []

    for (const product of mapped) {
      const existing = existingBySlug.get(product.slug)
      const imagePath = product.imageUrl ? imagePathFor(product.slug, product.imageUrl) : null

      if (!existing) {
        const wooProduct = wooBySlug.get(product.slug)!
        const recognizedIngredients = parseIngredientsFromText(ingredientSearchText(wooProduct), ingredientVocabulary)
        plans.push({
          action: "create",
          slug: product.slug,
          name: product.name,
          imageUrl: product.imageUrl,
          recognizedIngredients,
        })
        continue
      }

      const changes = diffStoreOwnedFields(existing, {
        name: product.name,
        shortDescription: product.shortDescription,
        officialUrl: product.officialUrl,
        imagePath,
      })

      if (changes.length === 0) {
        plans.push({ action: "unchanged", slug: product.slug, name: product.name })
      } else {
        plans.push({
          action: "update",
          slug: product.slug,
          name: product.name,
          changes,
          imageUrl: product.imageUrl,
        })
      }
    }

    // Discontinued: active locally but no longer in the WooCommerce feed.
    for (const existing of existingProducts) {
      if (existing.active && !wooSlugs.has(existing.slug)) {
        plans.push({ action: "deactivate", slug: existing.slug, name: existing.name })
      }
    }

    if (!options.dryRun) {
      const ingredientIdByName = new Map(ingredientVocabulary.map((ingredient) => [ingredient.name, ingredient.id]))

      await client.query("BEGIN")
      try {
        for (const plan of plans) {
          if (plan.action === "create") {
            const product = mapped.find((item) => item.slug === plan.slug)!
            const imagePath = product.imageUrl ? imagePathFor(product.slug, product.imageUrl) : null
            const productId = createId("product")
            // Dual-written alongside the ProductIngredient rows below while
            // Product.keyIngredients still exists (Phase 1) — kept in sync
            // so the column isn't silently abandoned mid-transition; it's
            // dropped in a later, separate migration once that's confirmed
            // safe (see prisma/schema.prisma).
            const keyIngredientsJson =
              plan.recognizedIngredients.length > 0 ? JSON.stringify(plan.recognizedIngredients) : null

            if (product.imageUrl) {
              await downloadProductImage(product.slug, product.imageUrl)
            }

            await client.query(
              `INSERT INTO "Product"
                (id, slug, name, category, "routineStep", "shortDescription", "imagePath",
                 "cosmeticBenefits", "bestFor", "avoidIf", "keyIngredients", "doshaTags",
                 "officialUrl", priority, active, "needsCuration", "createdAt", "updatedAt")
               VALUES ($1,$2,$3,$4,'TREAT',$5,$6,'[]'::jsonb,'[]'::jsonb,NULL,$8,NULL,$7,0,false,true,now(),now())`,
              [
                productId,
                product.slug,
                product.name,
                "Uncategorized",
                product.shortDescription,
                imagePath,
                product.officialUrl,
                keyIngredientsJson,
              ],
            )

            for (const ingredientName of plan.recognizedIngredients) {
              const ingredientId = ingredientIdByName.get(ingredientName)
              // Should always be found — recognizedIngredients only ever
              // contains names parse-inci.ts matched against this exact
              // vocabulary. Skips defensively rather than crashing the
              // whole sync if the Ingredient table changed mid-run.
              if (!ingredientId) continue

              await client.query(
                `INSERT INTO "ProductIngredient" (id, "productId", "ingredientId", "createdAt")
                 VALUES ($1,$2,$3,now())
                 ON CONFLICT ("productId", "ingredientId") DO NOTHING`,
                [createId("productingredient"), productId, ingredientId],
              )
            }
          } else if (plan.action === "update") {
            const product = mapped.find((item) => item.slug === plan.slug)!
            const imageChange = plan.changes.find((change) => change.field === "imagePath")
            if (imageChange && product.imageUrl) {
              await downloadProductImage(product.slug, product.imageUrl)
            }

            await client.query(
              `UPDATE "Product"
               SET name = $2, "shortDescription" = $3, "officialUrl" = $4,
                   "imagePath" = COALESCE($5, "imagePath"), "updatedAt" = now()
               WHERE slug = $1`,
              [
                product.slug,
                product.name,
                product.shortDescription,
                product.officialUrl,
                imageChange ? imageChange.to : null,
              ],
            )
          } else if (plan.action === "deactivate") {
            await client.query(`UPDATE "Product" SET active = false, "updatedAt" = now() WHERE slug = $1`, [
              plan.slug,
            ])
          }
        }
        await client.query("COMMIT")
      } catch (error) {
        await client.query("ROLLBACK")
        throw error
      }
    }

    return {
      dryRun: options.dryRun,
      plans,
      created: plans.filter((plan) => plan.action === "create").length,
      updated: plans.filter((plan) => plan.action === "update").length,
      deactivated: plans.filter((plan) => plan.action === "deactivate").length,
      unchanged: plans.filter((plan) => plan.action === "unchanged").length,
      total: mapped.length,
    }
  } finally {
    await client.end()
  }
}
