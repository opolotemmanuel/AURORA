import { describe, expect, it } from "vitest"

import { mapWooCommerceProduct } from "./map-woocommerce.ts"
import {
  malformedProduct,
  missingDescriptionProduct,
  multipleImagesProduct,
  normalInStockProduct,
  outOfStockProduct,
} from "./__fixtures__/woocommerce-products.ts"

const CURATED_KEYS = [
  "category",
  "routineStep",
  "priority",
  "cosmeticBenefits",
  "bestFor",
  "avoidIf",
  "keyIngredients",
  "doshaTags",
  "needsCuration",
  "active",
]

describe("mapWooCommerceProduct", () => {
  it("maps a normal in-stock product to the store-owned shape", () => {
    const mapped = mapWooCommerceProduct(normalInStockProduct)

    expect(mapped).toEqual({
      slug: "rosehip-face-oil",
      name: "Rosehip Face Oil",
      shortDescription: "Cold-pressed rosehip oil for daily glow.",
      officialUrl: "https://www.auroraorganics.co/product/rosehip-face-oil/",
      imageUrl: "https://www.auroraorganics.co/wp-content/uploads/2024/02/rosehip-face-oil.jpg",
    })
  })

  it("maps an out-of-stock product the same way — stock status is not a mapped field", () => {
    const mapped = mapWooCommerceProduct(outOfStockProduct)

    expect(mapped.slug).toBe("kaolin-clay-mask")
    expect(mapped.shortDescription).toBe("Purifying clay mask, gentle enough for weekly use.")
  })

  it("falls back to the stripped full description, then the name, when short_description is blank", () => {
    const mapped = mapWooCommerceProduct(missingDescriptionProduct)

    // Both description fields are "" in this fixture, so the final fallback
    // (product name) is what should surface.
    expect(mapped.shortDescription).toBe("Calendula Balm")
  })

  it("uses only the first image when multiple images are present", () => {
    const mapped = mapWooCommerceProduct(multipleImagesProduct)

    expect(mapped.imageUrl).toBe(
      "https://www.auroraorganics.co/wp-content/uploads/2024/06/vitamin-c-serum-front.jpg",
    )
  })

  it("does not crash on a malformed product (missing images, null short_description, blank slug)", () => {
    const mapped = mapWooCommerceProduct(malformedProduct)

    expect(mapped.imageUrl).toBeUndefined()
    // slug falls back to a slugified name; the raw name's surrounding
    // whitespace is preserved as-is since WooCommerce, not this sync, owns
    // trimming — the sync only guarantees it won't crash on it.
    expect(mapped.slug).toBe("mystery-night-cream")
    expect(mapped.shortDescription).toBe("Rich overnight cream.")
  })

  it("never invents or references curated fields for any fixture", () => {
    for (const fixture of [
      normalInStockProduct,
      outOfStockProduct,
      missingDescriptionProduct,
      multipleImagesProduct,
      malformedProduct,
    ]) {
      const mapped = mapWooCommerceProduct(fixture)

      for (const curatedKey of CURATED_KEYS) {
        expect(mapped).not.toHaveProperty(curatedKey)
      }
    }
  })
})
