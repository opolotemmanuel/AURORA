import { unstable_cache } from "next/cache"

import { prisma } from "@/lib/db/client"
import type { CatalogProductContext } from "@/lib/ai/types"

export const CATALOG_CONTEXT_TAG = "catalog-context"

export const getCatalogContext = unstable_cache(
  async (): Promise<CatalogProductContext[]> => {
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
      },
    })

    return products
  },
  ["catalog-context"],
  { tags: [CATALOG_CONTEXT_TAG] },
)
