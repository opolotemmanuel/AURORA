import { cache } from "react"

import { prisma } from "@/lib/db/client"
import type { CatalogProductContext } from "@/lib/ai/types"

export const CATALOG_CONTEXT_TAG = "catalog-context"

export const getCatalogContext = cache(
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
)
