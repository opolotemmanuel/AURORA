/** Fixed PRD cosmetic skin assessment dimensions. */
export const SKIN_DIMENSION_IDS = [
  "texture_pores",
  "pigmentation",
  "redness",
  "wrinkles",
  "hydration",
  "aging_spots",
] as const

export type SkinDimensionId = (typeof SKIN_DIMENSION_IDS)[number]

export const SKIN_DIMENSIONS: ReadonlyArray<{
  id: SkinDimensionId
  label: string
}> = [
  { id: "texture_pores", label: "Texture & pores" },
  { id: "pigmentation", label: "Pigmentation & sun spots" },
  { id: "redness", label: "Redness & visible capillaries" },
  { id: "wrinkles", label: "Wrinkles & fine lines" },
  { id: "hydration", label: "Hydration" },
  { id: "aging_spots", label: "Aging & dark spots" },
] as const

const DIMENSION_BY_ID = new Map(
  SKIN_DIMENSIONS.map((dimension) => [dimension.id, dimension]),
)

export function isSkinDimensionId(id: string): id is SkinDimensionId {
  return DIMENSION_BY_ID.has(id as SkinDimensionId)
}

export function getSkinDimensionLabel(id: SkinDimensionId): string {
  return DIMENSION_BY_ID.get(id)?.label ?? id
}
