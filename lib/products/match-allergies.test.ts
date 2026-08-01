import { describe, expect, it } from "vitest"

import { ingredientConflictsWithAllergies, parseAllergyTokens, productConflictsWithAllergies } from "./match-allergies"

describe("parseAllergyTokens", () => {
  it("splits comma and semicolon separated allergies", () => {
    expect(parseAllergyTokens("fragrance, lanolin; coconut")).toEqual(["fragrance", "lanolin", "coconut"])
  })
})

describe("ingredientConflictsWithAllergies", () => {
  it("matches fragrance synonyms against parfum", () => {
    const conflict = ingredientConflictsWithAllergies(["Aqua", "Glycerin", "Parfum"], "fragrance")

    expect(conflict).toBe(true)
  })

  it("matches tea tree allergy against melaleuca extract", () => {
    const conflict = ingredientConflictsWithAllergies(["Melaleuca Alternifolia (Tea Tree) Leaf Oil"], "tea tree")

    expect(conflict).toBe(true)
  })

  it("returns false when no allergies are provided", () => {
    const conflict = ingredientConflictsWithAllergies(["Parfum", "Linalool"], null)

    expect(conflict).toBe(false)
  })

  it("returns false when ingredient list is empty", () => {
    const conflict = ingredientConflictsWithAllergies([], "fragrance")

    expect(conflict).toBe(false)
  })
})

describe("productConflictsWithAllergies", () => {
  it("flags a real catalog product (Lavender Soothing Lotion) against a lavender allergy", () => {
    const conflict = productConflictsWithAllergies({ keyIngredients: ["Lavender"] }, "lavender")

    expect(conflict).toBe(true)
  })

  it("does not flag a product with no keyIngredients on file", () => {
    const conflict = productConflictsWithAllergies({ keyIngredients: null }, "lavender")

    expect(conflict).toBe(false)
  })
})
