import { getCatalogContext } from "@/lib/ai/context/catalog"
import { getUserScanContext } from "@/lib/ai/context/user"
import { analyzeWithGemini } from "@/lib/ai/providers/gemini"
import type { AnalyzeSkinInput, AnalyzeSkinResult } from "@/lib/ai/types"
import {
  mapUserClimateToTags,
  rankCatalogByClimateTags,
} from "@/lib/climate/tag-match"

export async function analyzeSkin(
  input: Omit<AnalyzeSkinInput, "catalog" | "userContext">,
): Promise<AnalyzeSkinResult> {
  const [catalog, userContext] = await Promise.all([
    getCatalogContext(),
    getUserScanContext(input.userId),
  ])

  if (catalog.length === 0) {
    throw new Error("No active products in catalog")
  }

  const activeClimateTags = mapUserClimateToTags(userContext.location)
  const rankedCatalog = rankCatalogByClimateTags(catalog, activeClimateTags)

  if (input.model.provider !== "gemini") {
    throw new Error(`Provider ${input.model.provider} is not supported yet`)
  }

  return analyzeWithGemini({
    ...input,
    catalog: rankedCatalog,
    userContext,
    activeClimateTags,
  })
}
