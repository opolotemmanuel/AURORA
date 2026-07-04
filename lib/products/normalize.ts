import type { ProductFormInput, ProductInput } from "@/lib/products/schemas"

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

function shortId() {
  return Math.random().toString(36).slice(2, 8)
}

export function buildProductSku(name: string): string {
  const base = slugify(name) || "product"
  return `aur-${base}-${shortId()}`.slice(0, 64)
}

export function buildProductSlug(name: string): string {
  const base = slugify(name) || "product"
  return `${base}-${shortId()}`.slice(0, 200)
}

type NormalizeOptions = {
  existingSku?: string
  existingSlug?: string
}

export function normalizeProductInput(
  input: ProductFormInput,
  options: NormalizeOptions = {},
): ProductInput {
  const slug =
    input.slug?.trim() ||
    options.existingSlug ||
    buildProductSlug(input.name)

  const sku =
    input.sku?.trim() ||
    options.existingSku ||
    buildProductSku(input.name)

  return {
    sku,
    slug,
    name: input.name.trim(),
    description: input.description.trim(),
    category: input.category.trim(),
    ingredients: input.ingredients?.trim() ?? "",
    targetConcerns: input.targetConcerns,
    suitableSkinTypes: input.suitableSkinTypes,
    climateTags: input.climateTags,
    imageUrl: input.imageUrl ?? "",
    isActive: input.isActive,
  }
}
