import { unstable_cache } from "next/cache"
import { cache } from "react"

import { prisma } from "@/lib/db/client"
import type { CatalogProductContext } from "@/lib/ai/types"
import {
  CATALOG_CACHE_REVALIDATE_SECONDS,
  CATALOG_CONTEXT_TAG,
} from "@/lib/ai/context/cache-tags"
import { resolveStoreUrl } from "@/lib/products/store-url"

export { CATALOG_CONTEXT_TAG } from "@/lib/ai/context/cache-tags"

async function fetchCatalogContext(): Promise<CatalogProductContext[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      slug: true,
      name: true,
      description: true,
      category: true,
      ingredients: true,
      targetConcerns: true,
      suitableSkinTypes: true,
      climateTags: true,
      storeUrl: true,
    },
  })

  return products.map((product) => ({
    slug: product.slug,
    name: product.name,
    description: product.description,
    category: product.category,
    ingredients: product.ingredients,
    targetConcerns: product.targetConcerns,
    suitableSkinTypes: product.suitableSkinTypes,
    climateTags: product.climateTags,
    purchaseUrl: resolveStoreUrl({
      storeUrl: product.storeUrl,
      slug: product.slug,
    }),
  }))
}

const getCachedCatalogContext = unstable_cache(
  fetchCatalogContext,
  [CATALOG_CONTEXT_TAG],
  {
    tags: [CATALOG_CONTEXT_TAG],
    revalidate: CATALOG_CACHE_REVALIDATE_SECONDS,
  },
)

export const getCatalogContext = cache(
  async (): Promise<CatalogProductContext[]> => getCachedCatalogContext(),
)
