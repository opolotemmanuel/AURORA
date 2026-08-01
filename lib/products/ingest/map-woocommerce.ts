// Maps a raw WooCommerce product to the STORE-OWNED slice of Product only.
// Deliberately does not port wyasyn/review's tag/description-based inference
// of targetConcerns/climateTags/ingredientList — those correspond to our
// curated fields (category, routineStep, priority, cosmeticBenefits,
// bestFor, avoidIf, doshaTags), which this sync never fabricates.
//
// keyIngredients is the one deliberate exception, and it's handled
// separately in sync-catalog.ts, not here: recognizing a known ingredient
// by exact name/alias match against the real Ingredient table (see
// lib/products/ingredients/parse-inci.ts) is a controlled-vocabulary lookup,
// not the free-form inference this file avoids — nothing gets invented that
// isn't already a real, curated Ingredient row. This function stays a pure
// mapping of store-owned fields either way.
import type { WooCommerceProduct, IngestProductInput } from "./types.ts"

export function mapWooCommerceProduct(product: WooCommerceProduct): IngestProductInput {
  const slug = product.slug || slugify(product.name)
  const shortDescription =
    stripHtml(product.short_description) || stripHtml(product.description).slice(0, 500) || product.name

  return {
    slug,
    name: product.name,
    shortDescription,
    officialUrl: product.permalink,
    imageUrl: product.images?.[0]?.src,
  }
}

// WooCommerce's REST API is only as reliable as the store's plugins/webhooks
// — description fields have been observed coming back `null` instead of the
// documented "" for blank text, so this tolerates non-string input rather
// than crashing the whole sync over one bad product.
export function stripHtml(value: string | null | undefined): string {
  if (!value) return ""

  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
