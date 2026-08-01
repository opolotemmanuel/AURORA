// One-time migration: seeds the 13 Ingredient rows (data migrated verbatim
// from lib/products/ingredients.ts — no content changes) and backfills each
// product's existing `keyIngredients` JSON array into the new
// ProductIngredient join table. Run once via `node scripts/seed-ingredients.ts`
// (or `--dry-run` to preview). Uses raw `pg`, not Prisma Client, matching
// scripts/sync-products.ts's convention (see that file's header comment for
// why — Prisma's generated client doesn't resolve under plain `node`).
//
// Idempotent: Ingredient rows are upserted by name, and ProductIngredient
// inserts use ON CONFLICT DO NOTHING against the (productId, ingredientId)
// unique constraint — safe to re-run.
//
// Phase 1 only: Product.keyIngredients is read here but never modified or
// dropped. That column stays untouched until a separate, later migration
// (see prisma/schema.prisma's PHASE 1/PHASE 2 comment) removes it, only
// after the backfill below is verified correct.
import { readFileSync } from "node:fs"
import pg from "pg"

type SeedIngredient = {
  name: string
  aliases: string[]
  description: string
  concerns: string[]
}

// Migrated verbatim from lib/products/ingredients.ts's INGREDIENT_LOOKUP —
// same descriptions, same approved concern mapping, no rewrites. `aliases`
// is empty for all 13: no aliases were ever proposed or approved alongside
// the concern mapping, so seeding one now (e.g. "Vitamin B3" for
// Niacinamide) would be inventing content that was never reviewed — left
// for a deliberate follow-up curation pass instead.
const INGREDIENTS: SeedIngredient[] = [
  {
    name: "Sandalwood",
    aliases: [],
    description:
      "A traditional botanical valued in cosmetics for its soothing, fragrant qualities — commonly associated with calming the look of the skin.",
    concerns: ["rednessAppearance"],
  },
  {
    name: "Turmeric",
    aliases: [],
    description:
      "A traditional botanical often included in cosmetic formulations for its brightening reputation and its role in supporting an even-looking skin tone.",
    concerns: ["pigmentationAppearance", "radiance"],
  },
  {
    name: "Gold",
    aliases: [],
    description:
      "Used in some cosmetic formulations mainly for a luminous, shimmering finish and a premium feel — included for cosmetic effect, not for any active skin-changing property.",
    concerns: [],
  },
  {
    name: "Lavender",
    aliases: [],
    description:
      "Commonly used in skincare for its calming scent, alongside a general reputation for soothing the look and feel of the skin.",
    concerns: ["rednessAppearance", "barrierComfort"],
  },
  {
    name: "Salicylic Acid",
    aliases: [],
    description:
      "A widely used cosmetic exfoliating ingredient, commonly included in cleansers to help refine the look of pores and support a clearer-looking complexion.",
    concerns: ["texture", "oilBalance"],
  },
  {
    name: "Niacinamide",
    aliases: [],
    description:
      "A well-known cosmetic ingredient commonly used to help even the appearance of skin tone and support the look of the skin's surface barrier.",
    concerns: ["pigmentationAppearance", "oilBalance"],
  },
  {
    name: "Neem",
    aliases: [],
    description:
      "A traditional botanical extract commonly included in formulations for its purifying reputation, often featured in products aimed at oily or blemish-prone-looking skin.",
    concerns: ["oilBalance", "rednessAppearance"],
  },
  {
    name: "Shea Butter",
    aliases: [],
    description: "A rich, emollient butter widely used in cosmetics to help soften and moisturize the skin.",
    concerns: ["hydration"],
  },
  {
    name: "Hyaluronic Acid",
    aliases: [],
    description:
      "A common cosmetic humectant known for helping skin attract and hold moisture, supporting a plumper, more hydrated look.",
    concerns: ["hydration"],
  },
  {
    name: "Cocoa Butter",
    aliases: [],
    description: "An emollient butter commonly used in balms and lip products to help soften and moisturize.",
    concerns: ["hydration"],
  },
  {
    name: "Castor Oil",
    aliases: [],
    description:
      "A thick, emollient plant oil commonly used in lip and skin products to help lock in moisture and add a smooth, glossy feel.",
    concerns: ["hydration", "texture"],
  },
  {
    name: "Glutathione",
    aliases: [],
    description:
      "An antioxidant commonly featured in brightening-focused cosmetic formulations, often included for its association with an even, radiant-looking complexion.",
    concerns: ["pigmentationAppearance", "radiance"],
  },
  {
    name: "Rose",
    aliases: [],
    description:
      "A traditional botanical water valued in cosmetics for its gentle, hydrating, soothing reputation and natural fragrance.",
    concerns: ["hydration", "rednessAppearance"],
  },
]

function readEnvVar(name: string): string {
  const envText = readFileSync(".env.local", "utf8")
  const line = envText.split("\n").find((entry) => entry.trim().startsWith(`${name}`))
  if (!line) {
    throw new Error(`${name} not found in .env.local`)
  }

  return line
    .slice(line.indexOf("=") + 1)
    .trim()
    .replace(/^"|"$/g, "")
}

function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${Date.now().toString(36)}_${random}`
}

type ProductRow = { id: string; slug: string; active: boolean; keyIngredients: unknown }

async function main() {
  const dryRun = process.argv.includes("--dry-run")
  const client = new pg.Client({ connectionString: readEnvVar("DATABASE_URL") })
  await client.connect()

  try {
    console.log(dryRun ? "DRY RUN — no database writes will happen.\n" : "Running for REAL.\n")

    console.log(`Seeding ${INGREDIENTS.length} ingredient rows...`)
    if (!dryRun) {
      await client.query("BEGIN")
    }

    try {
      for (const ingredient of INGREDIENTS) {
        console.log(`  upsert: ${ingredient.name} (concerns: ${ingredient.concerns.join(", ") || "none"})`)
        if (!dryRun) {
          await client.query(
            `INSERT INTO "Ingredient" (id, name, aliases, description, concerns, "createdAt", "updatedAt")
             VALUES ($1,$2,$3,$4,$5,now(),now())
             ON CONFLICT (name) DO UPDATE SET
               aliases = EXCLUDED.aliases,
               description = EXCLUDED.description,
               concerns = EXCLUDED.concerns,
               "updatedAt" = now()`,
            [createId("ingredient"), ingredient.name, ingredient.aliases, ingredient.description, ingredient.concerns],
          )
        }
      }

      // In a real run, the upserts above already committed within this
      // transaction, so this reads back real ids. In dry-run mode nothing
      // was actually inserted — build the lookup from the in-memory seed
      // list instead so the preview still correctly shows what WOULD
      // connect, rather than falsely reporting every name as unmatched.
      const ingredientIdByName = dryRun
        ? new Map(INGREDIENTS.map((ingredient) => [ingredient.name, "(pending)"]))
        : new Map(
            (
              await client.query<{ id: string; name: string }>(`SELECT id, name FROM "Ingredient"`)
            ).rows.map((row) => [row.name, row.id]),
          )

      const { rows: products } = await client.query<ProductRow>(
        `SELECT id, slug, active, "keyIngredients" FROM "Product"
         WHERE "keyIngredients" IS NOT NULL AND jsonb_array_length("keyIngredients"::jsonb) > 0`,
      )

      console.log(`\nBackfilling ProductIngredient rows for ${products.length} products with existing keyIngredients...`)

      let connected = 0
      let unmatched = 0

      for (const product of products) {
        const names = Array.isArray(product.keyIngredients)
          ? product.keyIngredients.filter((name): name is string => typeof name === "string")
          : []

        for (const name of names) {
          const ingredientId = ingredientIdByName.get(name)

          if (!ingredientId) {
            // Legacy free-text blob (pre-controlled-vocabulary data on a
            // couple of inactive products) or an otherwise unrecognized
            // name — never force-matched. Reported, not silently dropped.
            console.log(`  [skip]    ${product.slug} (active=${product.active}): no Ingredient row named "${name.slice(0, 60)}${name.length > 60 ? "..." : ""}"`)
            unmatched += 1
            continue
          }

          console.log(`  [connect] ${product.slug} <-> ${name}`)
          connected += 1

          if (!dryRun) {
            await client.query(
              `INSERT INTO "ProductIngredient" (id, "productId", "ingredientId", "createdAt")
               VALUES ($1,$2,$3,now())
               ON CONFLICT ("productId", "ingredientId") DO NOTHING`,
              [createId("productingredient"), product.id, ingredientId],
            )
          }
        }
      }

      if (!dryRun) {
        await client.query("COMMIT")
      }

      console.log(`\nSummary: ${INGREDIENTS.length} ingredients seeded, ${connected} product-ingredient links created, ${unmatched} names skipped (no controlled-vocabulary match).`)
    } catch (error) {
      if (!dryRun) {
        await client.query("ROLLBACK")
      }
      throw error
    }
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
