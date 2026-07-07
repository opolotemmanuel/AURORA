import type { ProductRecommendation } from "@/lib/scan/types"

type ValidateCatalogRecommendationsOptions = {
  minValid?: number
  max?: number
}

export function filterCatalogRecommendations(
  recommendations: ProductRecommendation[],
  catalogSlugs: Set<string>,
  options: ValidateCatalogRecommendationsOptions = {},
): ProductRecommendation[] {
  const { minValid = 2, max = 4 } = options
  const valid = recommendations.filter((rec) => catalogSlugs.has(rec.id))

  if (valid.length < minValid) {
    throw new Error("Model returned invalid product recommendations")
  }

  return valid.slice(0, max)
}

export async function getActiveCatalogSlugs(): Promise<Set<string>> {
  const { prisma } = await import("@/lib/db/client")
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { slug: true },
  })

  return new Set(products.map((product) => product.slug))
}
