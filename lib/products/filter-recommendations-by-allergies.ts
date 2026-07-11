import { prisma } from "@/lib/db/client"
import { productIngredientListConflictsWithAllergies } from "@/lib/products/match-allergies"
import type { ProductRecommendation } from "@/lib/scan/types"

export async function filterRecommendationsByAllergies(
  recommendations: ProductRecommendation[],
  allergies: string | null | undefined,
): Promise<ProductRecommendation[]> {
  if (!allergies?.trim() || recommendations.length === 0) {
    return recommendations
  }

  const slugs = [...new Set(recommendations.map((item) => item.id))]
  const products = await prisma.product.findMany({
    where: { slug: { in: slugs } },
    select: {
      slug: true,
      ingredientList: true,
      ingredients: true,
    },
  })

  const productBySlug = new Map(products.map((product) => [product.slug, product]))

  const filtered = recommendations.filter((recommendation) => {
    const product = productBySlug.get(recommendation.id)
    if (!product) {
      return true
    }

    return !productIngredientListConflictsWithAllergies(product, allergies)
  })

  if (filtered.length === 0) {
    return recommendations
  }

  return filtered
}
