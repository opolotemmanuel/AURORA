import "dotenv/config"
import { config } from "dotenv"
config({ path: ".env.local", override: true })
import { prisma } from "@/lib/db/client"
import { assessCompleteness } from "@/lib/products/completeness"

const SLUGS = ["gift-for-him","gold-serum","sandal-moisturiser","radiant-plump-soap","foot-soak"]

async function main() {
  const rows = await prisma.product.findMany({ where: { slug: { in: SLUGS } } })
  console.log(`found ${rows.length} of ${SLUGS.length}\n`)
  for (const p of rows) {
    const { score, missing } = assessCompleteness({
      name: p.name, description: p.description, brand: p.brand, imageUrl: p.imageUrl,
      primaryClassification: p.primaryClassification, targetConcerns: p.targetConcerns,
      suitableSkinTypes: p.suitableSkinTypes, cosmeticBenefits: p.cosmeticBenefits,
      climateTags: p.climateTags, ingredients: p.ingredients,
      routineCategory: p.routineCategory, priceCents: p.priceCents,
    })
    console.log(`── ${p.slug}  (${p.name})`)
    console.log(`   stored=${p.completenessScore}%  recomputed=${score}%  active=${p.isActive} recommendable=${p.isRecommendable} verification=${p.verificationStatus}`)
    console.log(`   category=${p.category}  classification=${p.primaryClassification ?? "—"}/${p.classificationConfidence}  routine=${p.routineCategory ?? "—"} step=${p.routineStep ?? "—"} am=${p.amSuitable} pm=${p.pmSuitable}`)
    console.log(`   concerns=[${p.targetConcerns.join(",")}]  skinTypes=[${p.suitableSkinTypes.join(",")}]  benefits=[${p.cosmeticBenefits.join(",")}]`)
    console.log(`   climateTags=[${p.climateTags.join(",")}] humidity=[${p.suitableHumidity}] temp=[${p.suitableTemperature}] uv=[${p.suitableUv}]`)
    console.log(`   ingredients=${p.ingredients ? JSON.stringify(p.ingredients.slice(0,90)) : "NULL"}  list=[${p.ingredientList.join(" | ")}]`)
    console.log(`   MISSING: ${missing.join(", ") || "(none)"}`)
    console.log(`   description: ${p.description.slice(0,200).replace(/\s+/g," ")}`)
    console.log("")
  }
}
main().finally(() => prisma.$disconnect())
