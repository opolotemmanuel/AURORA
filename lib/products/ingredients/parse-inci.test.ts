import { describe, expect, it } from "vitest"

import { findIngredientByNameOrAlias, parseIngredientsFromText } from "./parse-inci.ts"
import type { IngredientRecord } from "./types.ts"

const VOCABULARY: IngredientRecord[] = [
  {
    name: "Niacinamide",
    aliases: ["Vitamin B3"],
    description: "Helps even the appearance of skin tone.",
    concerns: ["pigmentationAppearance", "oilBalance"],
  },
  {
    name: "Rose",
    aliases: ["Rose Water"],
    description: "Hydrating, soothing botanical water.",
    concerns: ["hydration", "rednessAppearance"],
  },
  {
    name: "Neem",
    aliases: [],
    description: "Purifying botanical extract.",
    concerns: ["oilBalance", "rednessAppearance"],
  },
  {
    name: "Salicylic Acid",
    aliases: ["BHA"],
    description: "Cosmetic exfoliating ingredient.",
    concerns: ["texture", "oilBalance"],
  },
  {
    name: "Gold",
    aliases: [],
    description: "Included for cosmetic shimmer only.",
    concerns: [],
  },
]

describe("parseIngredientsFromText", () => {
  it("matches an exact canonical name", () => {
    expect(parseIngredientsFromText("Niacinamide, Aqua, Glycerin", VOCABULARY)).toEqual(["Niacinamide"])
  })

  it("matches via an alias, resolving to the canonical name", () => {
    expect(parseIngredientsFromText("Contains Vitamin B3 and water.", VOCABULARY)).toEqual(["Niacinamide"])
  })

  it("matches case-insensitively", () => {
    expect(parseIngredientsFromText("NIACINAMIDE and neem extract", VOCABULARY)).toEqual(["Niacinamide", "Neem"])
  })

  it("returns [] when no vocabulary ingredient is present", () => {
    expect(parseIngredientsFromText("Aqua, Glycerin, Parfum", VOCABULARY)).toEqual([])
  })

  it("recognizes multiple distinct ingredients in one text, in order of first appearance", () => {
    const text = "A brightening toner with Neem and Niacinamide, finished with a Rose Water mist."
    expect(parseIngredientsFromText(text, VOCABULARY)).toEqual(["Neem", "Niacinamide", "Rose"])
  })

  it("does not false-positive match a name that's a substring of a longer, unrelated word", () => {
    expect(parseIngredientsFromText("Made in Roseville using Primrose oil.", VOCABULARY)).toEqual([])
  })

  it("still matches the real word once it appears with a genuine boundary, alongside the substring collisions", () => {
    const text = "Made in Roseville using Primrose oil, finished with a splash of Rose."
    expect(parseIngredientsFromText(text, VOCABULARY)).toEqual(["Rose"])
  })

  it("handles multi-word ingredient names correctly (Salicylic Acid, not just Acid)", () => {
    expect(parseIngredientsFromText("Formulated with Salicylic Acid for clearer skin.", VOCABULARY)).toEqual([
      "Salicylic Acid",
    ])
  })

  it("recognizes real ingredients inside unstructured prose, not just a clean comma list", () => {
    const text =
      "Bring out the Brightness — enriched with Turmeric and the soothing effects of Neem, this serum " +
      "also features a touch of Niacinamide to help even out tone over time."
    const prose = [
      ...VOCABULARY,
      { name: "Turmeric", aliases: [], description: "Brightening botanical.", concerns: ["radiance"] },
    ] as IngredientRecord[]
    expect(parseIngredientsFromText(text, prose)).toEqual(["Turmeric", "Neem", "Niacinamide"])
  })

  it("returns [] for empty, whitespace-only, null, or undefined input", () => {
    expect(parseIngredientsFromText("", VOCABULARY)).toEqual([])
    expect(parseIngredientsFromText("   ", VOCABULARY)).toEqual([])
    expect(parseIngredientsFromText(null, VOCABULARY)).toEqual([])
    expect(parseIngredientsFromText(undefined, VOCABULARY)).toEqual([])
  })

  it("returns [] when the vocabulary itself is empty, never fabricating a match", () => {
    expect(parseIngredientsFromText("Niacinamide, Rose, Neem", [])).toEqual([])
  })

  it("dedupes an ingredient matched via both its name and an alias in the same text", () => {
    expect(parseIngredientsFromText("Rose and Rose Water together.", VOCABULARY)).toEqual(["Rose"])
  })
})

describe("findIngredientByNameOrAlias", () => {
  it("resolves an exact name match", () => {
    expect(findIngredientByNameOrAlias("Niacinamide", VOCABULARY)?.name).toBe("Niacinamide")
  })

  it("resolves an alias match, case-insensitively, trimmed", () => {
    expect(findIngredientByNameOrAlias("  vitamin b3  ", VOCABULARY)?.name).toBe("Niacinamide")
  })

  it("returns null for an unrecognized name", () => {
    expect(findIngredientByNameOrAlias("Foobar Extract", VOCABULARY)).toBeNull()
  })

  it("returns null for a substring of a real name rather than a loose partial match", () => {
    expect(findIngredientByNameOrAlias("Acid", VOCABULARY)).toBeNull()
  })

  it("returns null for empty input", () => {
    expect(findIngredientByNameOrAlias("", VOCABULARY)).toBeNull()
  })
})
