// Covers the ingredient-match bonus specifically (concern-band/climate/
// dosha scoring predate this change and aren't re-tested here). Products
// use bestFor: [] and no avoidIf/climate/dosha so the ingredient bonus is
// isolated — each product's score is exactly `priority + ingredient bonus`.
//
// ingredientDetails (description + concerns per ingredient) is built
// directly in these fixtures rather than looked up by name — that
// resolution now happens once upstream, in
// lib/backend/product-service.ts's mapProduct against the real Ingredient
// table, which is exactly what keeps this engine pure/self-contained (see
// its header comment). "Does an unrecognized name get dropped" is tested
// where that resolution actually happens (lib/products/ingredients/
// parse-inci.test.ts, lib/backend/product-service — not here).
import { describe, expect, it } from "vitest"

import { recommendAuroraProducts } from "./recommendation-engine.ts"
import type { AuroraProduct, CosmeticAnalysisInput, IngredientDetail } from "./types.ts"

const BASE_PRIORITY = 50

// Mirrors the real seeded concerns for the ingredients these tests use (see
// scripts/seed-ingredients.ts) — descriptions aren't exercised by scoring,
// so left blank here.
const CONCERNS_BY_NAME: Record<string, IngredientDetail["concerns"]> = {
  Niacinamide: ["pigmentationAppearance", "oilBalance"],
  Glutathione: ["pigmentationAppearance", "radiance"],
  Turmeric: ["pigmentationAppearance", "radiance"],
  "Shea Butter": ["hydration"],
  "Hyaluronic Acid": ["hydration"],
  "Cocoa Butter": ["hydration"],
  "Castor Oil": ["hydration", "texture"],
  Gold: [],
}

function product(id: string, ingredientNames: string[] | undefined): AuroraProduct {
  const ingredientDetails = ingredientNames?.map((name) => ({
    name,
    description: "",
    concerns: CONCERNS_BY_NAME[name] ?? [],
  }))

  return {
    id,
    name: id,
    category: "Test",
    routineStep: "treat",
    shortDescription: "",
    cosmeticBenefits: [],
    bestFor: [],
    keyIngredients: ingredientNames,
    ingredientDetails,
    priority: BASE_PRIORITY,
    active: true,
  }
}

function scoreOf(analysis: CosmeticAnalysisInput, products: AuroraProduct[], id: string): number {
  const matches = recommendAuroraProducts(analysis, products.length, products)
  const match = matches.find((m) => m.product.id === id)
  if (!match) throw new Error(`${id} did not score above zero`)
  return match.score
}

describe("recommendAuroraProducts — ingredient-match bonus", () => {
  it("adds +8 for a single matching ingredient when its concern is flagged mild/moderate/elevated", () => {
    const products = [product("niacinamide-product", ["Niacinamide"])]
    const analysis: CosmeticAnalysisInput = { pigmentationAppearance: "mild" }

    expect(scoreOf(analysis, products, "niacinamide-product")).toBe(BASE_PRIORITY + 8)
  })

  it("contributes nothing when the matched concern is only low/balanced/not_visible", () => {
    const products = [product("niacinamide-product", ["Niacinamide"])]

    for (const band of ["low", "balanced", "not_visible"] as const) {
      const score = scoreOf({ pigmentationAppearance: band }, products, "niacinamide-product")
      expect(score).toBe(BASE_PRIORITY)
    }
  })

  it("counts an ingredient once even when it maps to two flagged concerns", () => {
    // Niacinamide maps to pigmentationAppearance AND oilBalance.
    const products = [product("niacinamide-product", ["Niacinamide"])]
    const analysis: CosmeticAnalysisInput = { pigmentationAppearance: "elevated", oilBalance: "elevated" }

    expect(scoreOf(analysis, products, "niacinamide-product")).toBe(BASE_PRIORITY + 8)
  })

  it("sums per distinct matching ingredient, uncapped below the ceiling", () => {
    // Glutathione and Turmeric both map to pigmentationAppearance.
    const products = [product("brightening-product", ["Glutathione", "Turmeric"])]
    const analysis: CosmeticAnalysisInput = { pigmentationAppearance: "mild" }

    expect(scoreOf(analysis, products, "brightening-product")).toBe(BASE_PRIORITY + 16)
  })

  it("caps the total ingredient bonus at +20 regardless of how many ingredients match", () => {
    // All four map to hydration; 4 x 8 = 32, must clamp to 20.
    const products = [product("hydration-stack", ["Shea Butter", "Hyaluronic Acid", "Cocoa Butter", "Castor Oil"])]
    const analysis: CosmeticAnalysisInput = { hydration: "elevated" }

    expect(scoreOf(analysis, products, "hydration-stack")).toBe(BASE_PRIORITY + 20)
  })

  it("never gives Gold a bonus — it is deliberately unmapped (empty concerns)", () => {
    const products = [product("gold-product", ["Gold"])]
    const analysis: CosmeticAnalysisInput = {
      hydration: "elevated",
      texture: "elevated",
      rednessAppearance: "elevated",
      pigmentationAppearance: "elevated",
      radiance: "elevated",
    }

    expect(scoreOf(analysis, products, "gold-product")).toBe(BASE_PRIORITY)
  })

  it("contributes nothing for a product with no ingredientDetails", () => {
    const products = [product("plain-product", undefined)]
    const analysis: CosmeticAnalysisInput = { hydration: "elevated" }

    expect(scoreOf(analysis, products, "plain-product")).toBe(BASE_PRIORITY)
  })

  it("contributes nothing on a clean scan with no flagged concerns at all", () => {
    const products = [product("niacinamide-product", ["Niacinamide", "Glutathione"])]

    expect(scoreOf({}, products, "niacinamide-product")).toBe(BASE_PRIORITY)
  })

  it("contributes nothing for an ingredientDetail with no concerns even when everything is flagged", () => {
    const products: AuroraProduct[] = [
      {
        id: "empty-concerns-product",
        name: "empty-concerns-product",
        category: "Test",
        routineStep: "treat",
        shortDescription: "",
        cosmeticBenefits: [],
        bestFor: [],
        ingredientDetails: [{ name: "Mystery Extract", description: "", concerns: [] }],
        priority: BASE_PRIORITY,
        active: true,
      },
    ]
    const analysis: CosmeticAnalysisInput = { hydration: "elevated", texture: "elevated" }

    expect(scoreOf(analysis, products, "empty-concerns-product")).toBe(BASE_PRIORITY)
  })
})
