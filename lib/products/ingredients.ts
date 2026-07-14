// A small, explicit lookup of the real named actives that actually appear
// in Aurora Organics' own product copy (scripts/products_fallback.json),
// mapping each to a short, honest, non-medical description of its commonly
// known cosmetic role. This is not a general INCI database — it only
// covers ingredients confirmed present in this app's actual 13-product
// catalog (see Product.keyIngredients); nothing here was extrapolated to
// ingredients that aren't really in the catalog.
//
// Descriptions are phrased the same way the rest of this app frames
// cosmetic claims (AGENTS.md: "coarse, honest output only" / no medical
// claims) — "commonly used/known for," never "treats," "cures," "clinically
// proven," or an invented percentage.
export type IngredientInfo = {
  name: string
  description: string
}

const INGREDIENT_LOOKUP: Record<string, IngredientInfo> = {
  sandalwood: {
    name: "Sandalwood",
    description:
      "A traditional botanical valued in cosmetics for its soothing, fragrant qualities — commonly associated with calming the look of the skin.",
  },
  turmeric: {
    name: "Turmeric",
    description:
      "A traditional botanical often included in cosmetic formulations for its brightening reputation and its role in supporting an even-looking skin tone.",
  },
  gold: {
    name: "Gold",
    description:
      "Used in some cosmetic formulations mainly for a luminous, shimmering finish and a premium feel — included for cosmetic effect, not for any active skin-changing property.",
  },
  lavender: {
    name: "Lavender",
    description:
      "Commonly used in skincare for its calming scent, alongside a general reputation for soothing the look and feel of the skin.",
  },
  "salicylic acid": {
    name: "Salicylic Acid",
    description:
      "A widely used cosmetic exfoliating ingredient, commonly included in cleansers to help refine the look of pores and support a clearer-looking complexion.",
  },
  niacinamide: {
    name: "Niacinamide",
    description:
      "A well-known cosmetic ingredient commonly used to help even the appearance of skin tone and support the look of the skin's surface barrier.",
  },
  neem: {
    name: "Neem",
    description:
      "A traditional botanical extract commonly included in formulations for its purifying reputation, often featured in products aimed at oily or blemish-prone-looking skin.",
  },
  "shea butter": {
    name: "Shea Butter",
    description: "A rich, emollient butter widely used in cosmetics to help soften and moisturize the skin.",
  },
  "hyaluronic acid": {
    name: "Hyaluronic Acid",
    description:
      "A common cosmetic humectant known for helping skin attract and hold moisture, supporting a plumper, more hydrated look.",
  },
  "cocoa butter": {
    name: "Cocoa Butter",
    description: "An emollient butter commonly used in balms and lip products to help soften and moisturize.",
  },
  "castor oil": {
    name: "Castor Oil",
    description:
      "A thick, emollient plant oil commonly used in lip and skin products to help lock in moisture and add a smooth, glossy feel.",
  },
  glutathione: {
    name: "Glutathione",
    description:
      "An antioxidant commonly featured in brightening-focused cosmetic formulations, often included for its association with an even, radiant-looking complexion.",
  },
  rose: {
    name: "Rose",
    description:
      "A traditional botanical water valued in cosmetics for its gentle, hydrating, soothing reputation and natural fragrance.",
  },
}

// Case/whitespace-insensitive lookup — Product.keyIngredients values are
// authored to match these keys, but this stays forgiving of minor
// formatting differences rather than silently dropping a real ingredient
// over a casing mismatch.
export function getIngredientInfo(rawName: string): IngredientInfo | null {
  const key = rawName.trim().toLowerCase()
  return INGREDIENT_LOOKUP[key] ?? null
}

// Resolves a product's keyIngredients into display-ready info, skipping any
// name that isn't in the recognized lookup (e.g. free text that hasn't been
// normalized into a clean ingredient name) rather than guessing.
export function resolveIngredients(keyIngredients: string[] | undefined): IngredientInfo[] {
  if (!keyIngredients?.length) return []
  return keyIngredients.map(getIngredientInfo).filter((info): info is IngredientInfo => info !== null)
}
