import { z } from "zod"

const productFields = {
  sku: z.string().max(64).optional(),
  slug: z.string().max(200).optional(),
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().min(1, "Summary is required").max(5000),
  category: z.string().min(1, "Product type is required").max(120),
  ingredients: z.string().max(5000).optional(),
  targetConcerns: z.array(z.string()).default([]),
  suitableSkinTypes: z.array(z.string()).default([]),
  climateTags: z.array(z.string()).default([]),
  imageUrl: z.string().url().optional().or(z.literal("")),
  storeUrl: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
}

/** What the admin UI submits — sku/slug optional (auto-generated on save). */
export const productFormSchema = z.object(productFields)

/** Full persisted shape after server normalization. */
export const productSchema = z.object({
  sku: z.string().min(1).max(64),
  slug: z.string().min(1).max(200),
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  category: z.string().min(1).max(120),
  ingredients: z.string().max(5000).optional(),
  targetConcerns: z.array(z.string()).default([]),
  suitableSkinTypes: z.array(z.string()).default([]),
  climateTags: z.array(z.string()).default([]),
  imageUrl: z.string().url().optional().or(z.literal("")),
  storeUrl: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
})

export const PRODUCT_CLASSIFICATIONS = [
  "organic",
  "natural",
  "synthetic",
  "dermatological",
  "ayurvedic",
  "clinical",
  "other",
] as const

export type ProductClassificationValue = (typeof PRODUCT_CLASSIFICATIONS)[number]

/**
 * What a clinic submits for one of its own products.
 *
 * Deliberately has no organizationId, isActive or ownership field of any kind.
 * A clinic product's owner comes from the session and archiving goes through
 * its own action, so neither "create this for another clinic" nor "make this an
 * Aurora product" can be expressed here at all — which is stronger than
 * validating them away.
 */
export const clinicProductFormSchema = z.object({
  sku: productFields.sku,
  slug: productFields.slug,
  name: productFields.name,
  description: productFields.description,
  category: productFields.category,
  ingredients: productFields.ingredients,
  targetConcerns: productFields.targetConcerns,
  suitableSkinTypes: productFields.suitableSkinTypes,
  climateTags: productFields.climateTags,
  imageUrl: productFields.imageUrl,
  storeUrl: productFields.storeUrl,
  classifications: z.array(z.enum(PRODUCT_CLASSIFICATIONS)).default([]),
  isRecommendable: z.boolean().default(true),
})

export type ProductFormInput = z.infer<typeof productFormSchema>
export type ProductInput = z.infer<typeof productSchema>
export type ClinicProductFormInput = z.infer<typeof clinicProductFormSchema>
