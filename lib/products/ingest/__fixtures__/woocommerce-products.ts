// Synthetic WooCommerce REST API v3 product payloads for tests. Shapes match
// the real /wp-json/wc/v3/products response (see
// https://woocommerce.github.io/woocommerce-rest-api-docs/#product-properties):
// prices are decimal strings, stock_quantity is an integer, blank fields are
// "" or null (never omitted), images/categories are arrays of sub-objects.
// These are entirely made up — no real Aurora Organics product data.
import type { WooCommerceProduct } from "../types.ts"

// A full real WooCommerce product has ~50 fields; our WooCommerceProduct type
// only declares the ones the sync reads. Fixtures model the fuller real
// response (via WooCommerceApiProduct) so tests prove the mapper ignores
// everything it doesn't own, then get passed to mapWooCommerceProduct as
// WooCommerceProduct — safe because they're referenced via a typed const,
// not an inline literal, so TS's excess-property check doesn't fire.
type WooCommerceApiProduct = WooCommerceProduct & {
  id: number
  date_created: string
  type: "simple" | "variable"
  status: "publish" | "draft" | "private"
  featured: boolean
  catalog_visibility: "visible" | "catalog" | "search" | "hidden"
  sku: string
  price: string
  regular_price: string
  sale_price: string
  on_sale: boolean
  purchasable: boolean
  manage_stock: boolean
  stock_quantity: number | null
  stock_status: "instock" | "outofstock" | "onbackorder"
  categories: Array<{ id: number; name: string; slug: string }>
  tags: Array<{ id: number; name: string; slug: string }>
  images: Array<{
    id: number
    date_created: string
    date_modified: string
    src: string
    name: string
    alt: string
  }>
}

export const normalInStockProduct: WooCommerceApiProduct = {
  id: 101,
  name: "Rosehip Face Oil",
  slug: "rosehip-face-oil",
  permalink: "https://www.auroraorganics.co/product/rosehip-face-oil/",
  date_created: "2024-02-11T09:15:00",
  type: "simple",
  status: "publish",
  featured: false,
  catalog_visibility: "visible",
  description:
    "<p>A lightweight, cold-pressed rosehip oil that absorbs quickly and helps even out tone.</p>\n<p>Use morning or night as the last step in your routine.</p>\n",
  short_description: "<p>Cold-pressed rosehip oil for daily glow.</p>\n",
  sku: "AUR-RHO-30",
  price: "24.00",
  regular_price: "24.00",
  sale_price: "",
  on_sale: false,
  purchasable: true,
  manage_stock: true,
  stock_quantity: 42,
  stock_status: "instock",
  categories: [{ id: 12, name: "Face Oils", slug: "face-oils" }],
  tags: [],
  images: [
    {
      id: 501,
      date_created: "2024-02-11T09:15:00",
      date_modified: "2024-02-11T09:15:00",
      src: "https://www.auroraorganics.co/wp-content/uploads/2024/02/rosehip-face-oil.jpg",
      name: "rosehip-face-oil",
      alt: "",
    },
  ],
}

export const outOfStockProduct: WooCommerceApiProduct = {
  id: 102,
  name: "Kaolin Clay Mask",
  slug: "kaolin-clay-mask",
  permalink: "https://www.auroraorganics.co/product/kaolin-clay-mask/",
  date_created: "2024-03-04T14:02:00",
  type: "simple",
  status: "publish",
  featured: false,
  catalog_visibility: "visible",
  description: "<p>A gentle purifying clay mask for combination skin.</p>\n",
  short_description: "<p>Purifying clay mask, gentle enough for weekly use.</p>\n",
  sku: "AUR-KCM-75",
  price: "18.50",
  regular_price: "18.50",
  sale_price: "",
  on_sale: false,
  purchasable: false,
  manage_stock: true,
  stock_quantity: 0,
  stock_status: "outofstock",
  categories: [{ id: 13, name: "Masks", slug: "masks" }],
  tags: [{ id: 44, name: "bestseller", slug: "bestseller" }],
  images: [
    {
      id: 502,
      date_created: "2024-03-04T14:02:00",
      date_modified: "2024-03-04T14:02:00",
      src: "https://www.auroraorganics.co/wp-content/uploads/2024/03/kaolin-clay-mask.jpg",
      name: "kaolin-clay-mask",
      alt: "",
    },
  ],
}

// WooCommerce returns "" for blank text fields, not null — this models the
// realistic blank case (an unfinished product listing with no copy yet).
export const missingDescriptionProduct: WooCommerceApiProduct = {
  id: 103,
  name: "Calendula Balm",
  slug: "calendula-balm",
  permalink: "https://www.auroraorganics.co/product/calendula-balm/",
  date_created: "2024-05-20T11:30:00",
  type: "simple",
  status: "publish",
  featured: false,
  catalog_visibility: "visible",
  description: "",
  short_description: "",
  sku: "AUR-CAL-50",
  price: "16.00",
  regular_price: "16.00",
  sale_price: "",
  on_sale: false,
  purchasable: true,
  manage_stock: false,
  stock_quantity: null,
  stock_status: "instock",
  categories: [{ id: 14, name: "Balms", slug: "balms" }],
  tags: [],
  images: [],
}

export const multipleImagesProduct: WooCommerceApiProduct = {
  id: 104,
  name: "Vitamin C Serum",
  slug: "vitamin-c-serum",
  permalink: "https://www.auroraorganics.co/product/vitamin-c-serum/",
  date_created: "2024-06-01T08:45:00",
  type: "simple",
  status: "publish",
  featured: true,
  catalog_visibility: "visible",
  description:
    "<p>A brightening serum with 15% vitamin C.</p><ul><li>Reduces the look of dark spots</li><li>Lightweight, non-greasy finish</li></ul>",
  short_description: "<p>15% vitamin C brightening serum.</p>\n",
  sku: "AUR-VCS-30",
  price: "32.00",
  regular_price: "36.00",
  sale_price: "32.00",
  on_sale: true,
  purchasable: true,
  manage_stock: true,
  stock_quantity: 17,
  stock_status: "instock",
  categories: [{ id: 15, name: "Serums", slug: "serums" }],
  tags: [{ id: 45, name: "brightening", slug: "brightening" }],
  images: [
    {
      id: 503,
      date_created: "2024-06-01T08:45:00",
      date_modified: "2024-06-01T08:45:00",
      src: "https://www.auroraorganics.co/wp-content/uploads/2024/06/vitamin-c-serum-front.jpg",
      name: "vitamin-c-serum-front",
      alt: "Front of vitamin C serum bottle",
    },
    {
      id: 504,
      date_created: "2024-06-01T08:45:00",
      date_modified: "2024-06-01T08:45:00",
      src: "https://www.auroraorganics.co/wp-content/uploads/2024/06/vitamin-c-serum-back.jpg",
      name: "vitamin-c-serum-back",
      alt: "Back of vitamin C serum bottle with ingredients",
    },
  ],
}

// Simulates real-world API drift: a misbehaving plugin/webhook can omit or
// null out fields the declared type promises. `images` is missing entirely
// (not even an empty array) and `slug` is blank, forcing the mapper's
// slugify() fallback. `price`/`regular_price` are the wrong JS type (numbers,
// not the decimal strings WooCommerce actually returns) to prove the mapper
// tolerates garbage in fields it doesn't read.
export const malformedProduct = {
  id: 105,
  name: "  Mystery Night Cream  ",
  slug: "",
  permalink: "https://www.auroraorganics.co/product/mystery-night-cream/",
  date_created: "2024-07-15T00:00:00",
  type: "simple",
  status: "publish",
  featured: false,
  catalog_visibility: "visible",
  description: "<p>Rich overnight cream.</p>",
  short_description: null,
  sku: "AUR-MNC-50",
  price: 28,
  regular_price: 28,
  sale_price: "",
  on_sale: false,
  purchasable: true,
  manage_stock: true,
  stock_quantity: 5,
  stock_status: "instock",
  categories: [{ id: 16, name: "Moisturizers", slug: "moisturizers" }],
  tags: [],
} as unknown as WooCommerceApiProduct

// Realistic prose — real ingredient names mentioned mid-sentence, not a
// clean comma-separated list — for testing parse-inci.ts's auto-recognition
// during ingestion (sync-catalog.ts). "Neem" appears only past the 500-char
// mark of the full description, so a test using this fixture also proves
// the sync scans the raw description, not IngestProductInput's truncated
// shortDescription fallback.
export const brighteningToneProduct: WooCommerceApiProduct = {
  id: 106,
  name: "Brightening Tone Toner",
  slug: "brightening-tone-toner",
  permalink: "https://www.auroraorganics.co/product/brightening-tone-toner/",
  date_created: "2024-08-01T00:00:00",
  type: "simple",
  status: "publish",
  featured: false,
  catalog_visibility: "visible",
  description:
    "<p>Our most requested toner, reformulated for an even, radiant-looking complexion. " +
    "Enriched with Niacinamide to help even the appearance of skin tone, and gentle enough " +
    "for daily use. " +
    "A".repeat(420) +
    " Also featuring Neem, a traditional botanical prized for its purifying reputation.</p>",
  short_description: "",
  sku: "AUR-BTT-30",
  price: "26.00",
  regular_price: "26.00",
  sale_price: "",
  on_sale: false,
  purchasable: true,
  manage_stock: true,
  stock_quantity: 30,
  stock_status: "instock",
  categories: [{ id: 17, name: "Toners", slug: "toners" }],
  tags: [],
  images: [
    {
      id: 505,
      date_created: "2024-08-01T00:00:00",
      date_modified: "2024-08-01T00:00:00",
      src: "https://www.auroraorganics.co/wp-content/uploads/2024/08/brightening-tone-toner.jpg",
      name: "brightening-tone-toner",
      alt: "",
    },
  ],
}

export const allFixtureProducts: WooCommerceApiProduct[] = [
  normalInStockProduct,
  outOfStockProduct,
  missingDescriptionProduct,
  multipleImagesProduct,
  malformedProduct,
]

// Builds N synthetic products for pagination tests — cheap, distinct slugs,
// no fields the sync doesn't already exercise above.
export function buildProducts(count: number, offset = 0): WooCommerceApiProduct[] {
  return Array.from({ length: count }, (_, index) => {
    const n = offset + index + 1
    return {
      ...normalInStockProduct,
      id: 1000 + n,
      name: `Fixture Product ${n}`,
      slug: `fixture-product-${n}`,
      permalink: `https://www.auroraorganics.co/product/fixture-product-${n}/`,
    }
  })
}
