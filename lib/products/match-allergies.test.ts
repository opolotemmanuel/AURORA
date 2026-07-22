import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { ingredientConflictsWithAllergies, parseAllergyTokens, productConflictsWithAllergies } from "./match-allergies"

describe("parseAllergyTokens", () => {
  it("splits comma and semicolon separated allergies", () => {
    assert.deepEqual(parseAllergyTokens("fragrance, lanolin; coconut"), ["fragrance", "lanolin", "coconut"])
  })
})

describe("ingredientConflictsWithAllergies", () => {
  it("matches fragrance synonyms against parfum", () => {
    const conflict = ingredientConflictsWithAllergies(["Aqua", "Glycerin", "Parfum"], "fragrance")

    assert.equal(conflict, true)
  })

  it("matches tea tree allergy against melaleuca extract", () => {
    const conflict = ingredientConflictsWithAllergies(["Melaleuca Alternifolia (Tea Tree) Leaf Oil"], "tea tree")

    assert.equal(conflict, true)
  })

  it("returns false when no allergies are provided", () => {
    const conflict = ingredientConflictsWithAllergies(["Parfum", "Linalool"], null)

    assert.equal(conflict, false)
  })

  it("returns false when ingredient list is empty", () => {
    const conflict = ingredientConflictsWithAllergies([], "fragrance")

    assert.equal(conflict, false)
  })
})

describe("productConflictsWithAllergies", () => {
  it("flags a real catalog product (Lavender Soothing Lotion) against a lavender allergy", () => {
    const conflict = productConflictsWithAllergies({ keyIngredients: ["Lavender"] }, "lavender")

    assert.equal(conflict, true)
  })

  it("does not flag a product with no keyIngredients on file", () => {
    const conflict = productConflictsWithAllergies({ keyIngredients: null }, "lavender")

    assert.equal(conflict, false)
  })
})
