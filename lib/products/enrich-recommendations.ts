import { prisma } from "@/lib/db/client"
import { resolveStoreUrl } from "@/lib/products/store-url"
import type { ProductRecommendation } from "@/lib/scan/types"

type CatalogProductFields = {
  slug: string
  imageUrl: string | null
  storeUrl: string | null
}

async function getCatalogProductMap(
  slugs: string[],
): Promise<Map<string, CatalogProductFields>> {
  if (slugs.length === 0) {
    return new Map()
  }

  const products = await prisma.product.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true, imageUrl: true, storeUrl: true },
  })

  return new Map(products.map((product) => [product.slug, product]))
}

function applyCatalogFields(
  recommendations: ProductRecommendation[],
  catalogBySlug: Map<string, CatalogProductFields>,
): ProductRecommendation[] {
  return recommendations.map((item) => {
    const catalog = catalogBySlug.get(item.id)

    return {
      ...item,
      imageUrl: item.imageUrl ?? catalog?.imageUrl ?? null,
      storeUrl:
        item.storeUrl ??
        resolveStoreUrl({
          storeUrl: catalog?.storeUrl,
          slug: item.id,
        }),
    }
  })
}

export async function enrichRecommendationsWithImages(
  recommendations: ProductRecommendation[],
): Promise<ProductRecommendation[]> {
  if (recommendations.length === 0) {
    return recommendations
  }

  const catalogBySlug = await getCatalogProductMap(
    recommendations.map((item) => item.id),
  )

  return applyCatalogFields(recommendations, catalogBySlug)
}

export async function enrichManyRecommendationsWithImages(
  recommendationGroups: ProductRecommendation[][],
): Promise<ProductRecommendation[][]> {
  const slugs = recommendationGroups.flatMap((group) =>
    group.map((item) => item.id),
  )

  const catalogBySlug = await getCatalogProductMap([...new Set(slugs)])

  return recommendationGroups.map((group) =>
    applyCatalogFields(group, catalogBySlug),
  )
}
