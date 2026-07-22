// Adapted from wyasyn/aura's review branch equivalent, which re-fetched
// products from Postgres by slug *after* scoring and filtered the
// already-ranked ProductRecommendation[] — a shape/type (lib/scan/types.ts's
// ProductRecommendation) we don't have. Our recommendation-engine.ts instead
// takes a plain AuroraProduct[] catalog and scores it (see
// lib/backend/scan-service.ts, app/api/recommendations/route.ts), so this
// filters that same catalog *before* scoring — no second DB round-trip
// needed since callers already hold the full product list.
//
// This is a safety exclusion, not a scoring penalty: a product whose
// keyIngredients conflicts with a declared allergy must never reach
// recommendAuroraProducts, regardless of how well it would otherwise match.
// Deliberately does NOT carry over review's "if filtering would remove
// every recommendation, fall back to showing the unfiltered list" behavior —
// that would surface an allergenic product to the user it was excluded for,
// which contradicts the exclusion guarantee this function exists to provide.
import type { AuroraProduct } from "@/lib/recommendations/types"

import { productConflictsWithAllergies } from "./match-allergies"

export function filterProductsByAllergies(
  products: AuroraProduct[],
  allergies: string | null | undefined,
): AuroraProduct[] {
  if (!allergies?.trim() || products.length === 0) {
    return products
  }

  return products.filter((product) => !productConflictsWithAllergies(product, allergies))
}
