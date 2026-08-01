// Raw WooCommerce REST v3 product shape — only the fields the sync actually
// reads. WooCommerce returns many more; deliberately not modeling tags/
// categories/meta_data here since (unlike wyasyn/review) nothing in this
// sync infers curated fields from them.
export type WooCommerceProduct = {
  id: number
  name: string
  slug: string
  permalink: string
  short_description: string
  description: string
  images: Array<{ src: string }>
}

// What the sync is willing to derive from WooCommerce — the STORE-OWNED
// slice of Product, never the curated fields (category, routineStep,
// priority, cosmeticBenefits, bestFor, avoidIf, keyIngredients, doshaTags).
export type IngestProductInput = {
  slug: string
  name: string
  shortDescription: string
  officialUrl: string
  imageUrl?: string
}

export type FieldChange = {
  field: "name" | "shortDescription" | "officialUrl" | "imagePath"
  from: string | null
  to: string | null
}

export type ProductSyncPlan =
  | {
      action: "create"
      slug: string
      name: string
      imageUrl?: string
      // Ingredient names parse-inci.ts recognized in the raw WooCommerce
      // description text, against the real Ingredient table — never
      // fabricated, [] when nothing in the controlled vocabulary was
      // found. Existing/curated products never get this treatment; see
      // sync-catalog.ts.
      recognizedIngredients: string[]
    }
  | { action: "update"; slug: string; name: string; changes: FieldChange[]; imageUrl?: string }
  | { action: "unchanged"; slug: string; name: string }
  | { action: "deactivate"; slug: string; name: string }

export type CatalogSyncResult = {
  dryRun: boolean
  plans: ProductSyncPlan[]
  created: number
  updated: number
  deactivated: number
  unchanged: number
  total: number
}
