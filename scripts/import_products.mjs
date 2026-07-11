import fs from "node:fs"
import pg from "pg"

const envText = fs.readFileSync(".env.local", "utf8")
const url = envText
  .split("\n")
  .find((l) => l.startsWith("DATABASE_URL="))
  .slice("DATABASE_URL=".length)
  .trim()
  .replace(/^"|"$/g, "")

const items = JSON.parse(fs.readFileSync("scripts/products_import.json", "utf8"))

function createId(prefix) {
  const random = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${Date.now().toString(36)}_${random}`
}

const ROUTINE_STEP_ENUM = {
  cleanse: "CLEANSE",
  treat: "TREAT",
  moisturize: "MOISTURIZE",
  protect: "PROTECT",
}

async function main() {
  const client = new pg.Client({ connectionString: url })
  await client.connect()

  try {
    await client.query("BEGIN")

    // Retire the 5 fake placeholder products.
    // Referenced by an existing Recommendation row -> soft-delete (active=false).
    const softDeleteSlugs = ["aurora-glow-serum", "barrier-calm-cream", "mineral-day-shield"]
    // Not referenced by any Recommendation row -> safe to hard-delete.
    const hardDeleteSlugs = ["radiance-daily-cleanser", "ayurvedic-night-renewal-oil"]

    const softResult = await client.query(
      `UPDATE "Product" SET active = false, "updatedAt" = now() WHERE slug = ANY($1::text[]) RETURNING slug`,
      [softDeleteSlugs],
    )
    const hardResult = await client.query(
      `DELETE FROM "Product" WHERE slug = ANY($1::text[]) RETURNING slug`,
      [hardDeleteSlugs],
    )

    const insertedSlugs = []
    for (const item of items) {
      const id = createId("product")
      await client.query(
        `INSERT INTO "Product"
          (id, slug, name, category, "routineStep", "shortDescription", "imagePath",
           "cosmeticBenefits", "bestFor", "avoidIf", "keyIngredients", "officialUrl",
           priority, active, "createdAt", "updatedAt")
         VALUES ($1,$2,$3,$4,$5::"RoutineStep",$6,$7,$8::jsonb,$9::jsonb,$10::jsonb,$11::jsonb,$12,$13,$14,now(),now())`,
        [
          id,
          item.slug,
          item.name,
          item.category,
          ROUTINE_STEP_ENUM[item.routineStep],
          item.shortDescription,
          item.imagePath,
          JSON.stringify(item.cosmeticBenefits),
          JSON.stringify(item.bestFor),
          item.avoidIf ? JSON.stringify(item.avoidIf) : null,
          item.keyIngredients ? JSON.stringify(item.keyIngredients) : null,
          item.officialUrl,
          item.priority,
          item.active,
        ],
      )
      insertedSlugs.push(item.slug)
    }

    await client.query("COMMIT")

    console.log("Soft-deleted (active=false):", softResult.rows.map((r) => r.slug))
    console.log("Hard-deleted:", hardResult.rows.map((r) => r.slug))
    console.log(`Inserted ${insertedSlugs.length} products.`)
  } catch (err) {
    await client.query("ROLLBACK")
    throw err
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
