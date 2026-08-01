// Exercises sync-catalog.ts's decision logic and atomicity against an
// in-memory fake pg.Client and a mocked fetchWooCommerceProducts — zero real
// network calls and zero real database connections. Most scenarios run in
// dry-run mode (no writes at all); the atomicity test runs for real against
// the fake client, with global fetch/fs stubbed so a "create" plan's image
// download never touches the real network or filesystem.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

type RecordedQuery = { sql: string; params: unknown[] }
type FakeClientState = {
  queries: RecordedQuery[]
  existingRows: unknown[]
  ingredientRows: unknown[]
  failOnIndex: number | null
  committed: boolean
  rolledBack: boolean
}

const { fakeClientState, FakeClient } = vi.hoisted(() => {
  const fakeClientState: FakeClientState = {
    queries: [],
    existingRows: [],
    ingredientRows: [],
    failOnIndex: null,
    committed: false,
    rolledBack: false,
  }

  class FakeClient {
    constructor(_config: unknown) {}
    async connect() {}
    async end() {}
    async query(sql: string, params: unknown[] = []) {
      const normalized = String(sql).trim()
      const index = fakeClientState.queries.length
      fakeClientState.queries.push({ sql: normalized, params })

      if (fakeClientState.failOnIndex === index) {
        throw new Error("Simulated database failure mid-run")
      }

      if (/^BEGIN\b/i.test(normalized)) return { rows: [] }
      if (/^COMMIT\b/i.test(normalized)) {
        fakeClientState.committed = true
        return { rows: [] }
      }
      if (/^ROLLBACK\b/i.test(normalized)) {
        fakeClientState.rolledBack = true
        return { rows: [] }
      }
      if (/^SELECT.*FROM "Ingredient"/i.test(normalized)) return { rows: fakeClientState.ingredientRows }
      if (/^SELECT\b/i.test(normalized)) return { rows: fakeClientState.existingRows }

      return { rows: [] }
    }
  }

  return { fakeClientState, FakeClient }
})

vi.mock("pg", () => ({ default: { Client: FakeClient } }))
vi.mock("node:fs", () => ({ writeFileSync: vi.fn(), mkdirSync: vi.fn() }))
vi.mock("./woocommerce.ts", () => ({ fetchWooCommerceProducts: vi.fn() }))

import { fetchWooCommerceProducts } from "./woocommerce.ts"
import { syncProductCatalog } from "./sync-catalog.ts"
import {
  brighteningToneProduct,
  missingDescriptionProduct,
  multipleImagesProduct,
  normalInStockProduct,
  outOfStockProduct,
} from "./__fixtures__/woocommerce-products.ts"

// A trimmed slice of the real seeded vocabulary (see
// scripts/seed-ingredients.ts) — just what these tests need.
const TEST_VOCABULARY = [
  {
    id: "ingredient_niacinamide",
    name: "Niacinamide",
    aliases: [],
    description: "Helps even the appearance of skin tone.",
    concerns: ["pigmentationAppearance", "oilBalance"],
  },
  {
    id: "ingredient_neem",
    name: "Neem",
    aliases: [],
    description: "Purifying botanical extract.",
    concerns: ["oilBalance", "rednessAppearance"],
  },
]

const CURATED_COLUMN_PATTERN = /category|routineStep|priority|cosmeticBenefits|bestFor|avoidIf|keyIngredients|doshaTags/

// Parses `INSERT INTO "Product" (col, col, ...) VALUES (v, v, ...)` into a
// column -> resolved-value map, substituting $n placeholders with the
// matching params[] entry, so tests can assert on real column semantics
// (including hardcoded literals like `false`/`true`/`'TREAT'`) instead of
// fragile whole-string matching. Safe to split on "," here: this specific
// query has no nested commas inside any individual value token.
function parseInsertProduct(sql: string, params: unknown[]): Record<string, unknown> {
  const columnsMatch = sql.match(/INSERT INTO "Product"\s*\(([\s\S]*?)\)\s*VALUES/i)
  const valuesMatch = sql.match(/VALUES\s*\(([\s\S]*)\)\s*$/i)
  if (!columnsMatch || !valuesMatch) throw new Error(`Could not parse INSERT statement: ${sql}`)

  const columns = columnsMatch[1].split(",").map((c) => c.trim().replace(/^"|"$/g, ""))
  const values = valuesMatch[1].split(",").map((v) => v.trim())

  const result: Record<string, unknown> = {}
  columns.forEach((column, i) => {
    const value = values[i]
    const placeholderMatch = value.match(/^\$(\d+)$/)
    result[column] = placeholderMatch ? params[Number(placeholderMatch[1]) - 1] : value
  })
  return result
}

function resetFakeClient(existingRows: unknown[] = [], ingredientRows: unknown[] = []) {
  fakeClientState.queries = []
  fakeClientState.existingRows = existingRows
  fakeClientState.ingredientRows = ingredientRows
  fakeClientState.failOnIndex = null
  fakeClientState.committed = false
  fakeClientState.rolledBack = false
}

describe("syncProductCatalog", () => {
  beforeEach(() => {
    resetFakeClient()
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), { status: 200 })),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.mocked(fetchWooCommerceProducts).mockReset()
  })

  describe("dry run — decision logic, no writes", () => {
    it("flags a brand-new product as create, and issues no BEGIN/COMMIT at all", async () => {
      vi.mocked(fetchWooCommerceProducts).mockResolvedValue([normalInStockProduct])
      resetFakeClient([])

      const result = await syncProductCatalog("postgres://fake", { dryRun: true })

      expect(result.plans).toEqual([
        {
          action: "create",
          slug: "rosehip-face-oil",
          name: "Rosehip Face Oil",
          imageUrl: "https://www.auroraorganics.co/wp-content/uploads/2024/02/rosehip-face-oil.jpg",
          recognizedIngredients: [],
        },
      ])
      expect(result.created).toBe(1)
      // Only the two read-only SELECTs (Product, Ingredient vocabulary)
      // should have run — dry-run must not open a transaction or write
      // anything.
      expect(fakeClientState.queries).toHaveLength(2)
      expect(fakeClientState.queries.every((q) => /^SELECT/i.test(q.sql))).toBe(true)
    })

    it("flags an existing product (matched by slug) with a changed store-owned field as update", async () => {
      vi.mocked(fetchWooCommerceProducts).mockResolvedValue([normalInStockProduct])
      resetFakeClient([
        {
          id: "product_1",
          slug: "rosehip-face-oil",
          name: "Old Rosehip Oil Name",
          shortDescription: "Cold-pressed rosehip oil for daily glow.",
          imagePath: "/products/rosehip-face-oil.jpg",
          officialUrl: "https://www.auroraorganics.co/product/rosehip-face-oil/",
          active: true,
        },
      ])

      const result = await syncProductCatalog("postgres://fake", { dryRun: true })

      expect(result.plans).toEqual([
        {
          action: "update",
          slug: "rosehip-face-oil",
          name: "Rosehip Face Oil",
          imageUrl: "https://www.auroraorganics.co/wp-content/uploads/2024/02/rosehip-face-oil.jpg",
          changes: [{ field: "name", from: "Old Rosehip Oil Name", to: "Rosehip Face Oil" }],
        },
      ])
    })

    it("flags a product identical to WooCommerce as unchanged", async () => {
      vi.mocked(fetchWooCommerceProducts).mockResolvedValue([missingDescriptionProduct])
      resetFakeClient([
        {
          id: "product_2",
          slug: "calendula-balm",
          name: "Calendula Balm",
          shortDescription: "Calendula Balm",
          imagePath: null,
          officialUrl: "https://www.auroraorganics.co/product/calendula-balm/",
          active: true,
        },
      ])

      const result = await syncProductCatalog("postgres://fake", { dryRun: true })

      expect(result.plans).toEqual([{ action: "unchanged", slug: "calendula-balm", name: "Calendula Balm" }])
    })

    it("flags a locally-active product absent from the WooCommerce feed as deactivate, never delete", async () => {
      vi.mocked(fetchWooCommerceProducts).mockResolvedValue([normalInStockProduct])
      resetFakeClient([
        {
          id: "product_3",
          slug: "discontinued-toner",
          name: "Discontinued Toner",
          shortDescription: "No longer sold.",
          imagePath: null,
          officialUrl: null,
          active: true,
        },
        {
          id: "product_1",
          slug: "rosehip-face-oil",
          name: "Rosehip Face Oil",
          shortDescription: "Cold-pressed rosehip oil for daily glow.",
          imagePath: "/products/rosehip-face-oil.jpg",
          officialUrl: "https://www.auroraorganics.co/product/rosehip-face-oil/",
          active: true,
        },
      ])

      const result = await syncProductCatalog("postgres://fake", { dryRun: true })

      expect(result.plans).toContainEqual({
        action: "deactivate",
        slug: "discontinued-toner",
        name: "Discontinued Toner",
      })
      expect(result.deactivated).toBe(1)
    })

    it("never proposes reactivating a product that is inactive locally but still in the feed", async () => {
      vi.mocked(fetchWooCommerceProducts).mockResolvedValue([normalInStockProduct])
      resetFakeClient([
        {
          id: "product_1",
          slug: "rosehip-face-oil",
          name: "Rosehip Face Oil",
          shortDescription: "Cold-pressed rosehip oil for daily glow.",
          imagePath: "/products/rosehip-face-oil.jpg",
          officialUrl: "https://www.auroraorganics.co/product/rosehip-face-oil/",
          active: false, // deliberately deactivated by hand
        },
      ])

      const result = await syncProductCatalog("postgres://fake", { dryRun: true })

      // Identical store-owned fields -> unchanged. Crucially, no plan action
      // exists that would ever set active back to true.
      expect(result.plans).toEqual([{ action: "unchanged", slug: "rosehip-face-oil", name: "Rosehip Face Oil" }])
    })
  })

  describe("real run — writes and column-level field ownership", () => {
    it("creates a new product with placeholder curated fields and needsCuration=true, active=false", async () => {
      vi.mocked(fetchWooCommerceProducts).mockResolvedValue([normalInStockProduct])
      resetFakeClient([])

      await syncProductCatalog("postgres://fake", { dryRun: false })

      const insertQuery = fakeClientState.queries.find((q) => /^INSERT INTO "Product"/i.test(q.sql))
      expect(insertQuery).toBeDefined()
      const row = parseInsertProduct(insertQuery!.sql, insertQuery!.params)

      expect(row.active).toBe("false")
      expect(row.needsCuration).toBe("true")
      expect(row.priority).toBe("0")
      expect(row.category).toBe("Uncategorized")
      expect(row.routineStep).toBe("'TREAT'")
      expect(row.cosmeticBenefits).toBe("'[]'::jsonb")
      expect(row.bestFor).toBe("'[]'::jsonb")
      expect(row.avoidIf).toBe("NULL")
      // keyIngredients is a real parameter now (dual-written alongside
      // ProductIngredient — see the ingredient-recognition tests below),
      // not an inline SQL literal — null here because this fixture's
      // vocabulary is empty, so nothing was recognized.
      expect(row.keyIngredients).toBeNull()
      expect(row.doshaTags).toBe("NULL")
      expect(row.name).toBe("Rosehip Face Oil")
      expect(fakeClientState.committed).toBe(true)
    })

    it("updates only store-owned columns, never a curated column, active, or needsCuration", async () => {
      vi.mocked(fetchWooCommerceProducts).mockResolvedValue([normalInStockProduct])
      resetFakeClient([
        {
          id: "product_1",
          slug: "rosehip-face-oil",
          name: "Old Rosehip Oil Name",
          shortDescription: "Cold-pressed rosehip oil for daily glow.",
          imagePath: "/products/rosehip-face-oil.jpg",
          officialUrl: "https://www.auroraorganics.co/product/rosehip-face-oil/",
          active: false,
        },
      ])

      await syncProductCatalog("postgres://fake", { dryRun: false })

      const updateQuery = fakeClientState.queries.find((q) => /^UPDATE "Product"/i.test(q.sql))
      expect(updateQuery).toBeDefined()
      expect(updateQuery!.sql).not.toMatch(CURATED_COLUMN_PATTERN)
      expect(updateQuery!.sql).not.toMatch(/\bactive\b/)
      expect(updateQuery!.sql).not.toMatch(/needsCuration/)
      expect(updateQuery!.sql).toMatch(/name = \$2/)
    })

    it("deactivates a removed product by setting active=false — never issues a DELETE", async () => {
      vi.mocked(fetchWooCommerceProducts).mockResolvedValue([])
      resetFakeClient([
        {
          id: "product_3",
          slug: "discontinued-toner",
          name: "Discontinued Toner",
          shortDescription: "No longer sold.",
          imagePath: null,
          officialUrl: null,
          active: true,
        },
      ])

      await syncProductCatalog("postgres://fake", { dryRun: false })

      const deactivateQuery = fakeClientState.queries.find((q) => /^UPDATE "Product" SET active = false/i.test(q.sql))
      expect(deactivateQuery).toBeDefined()
      expect(fakeClientState.queries.some((q) => /^DELETE/i.test(q.sql))).toBe(false)
    })

    it("writes nothing at all for an unchanged product beyond BEGIN/SELECT/COMMIT", async () => {
      vi.mocked(fetchWooCommerceProducts).mockResolvedValue([missingDescriptionProduct])
      resetFakeClient([
        {
          id: "product_2",
          slug: "calendula-balm",
          name: "Calendula Balm",
          shortDescription: "Calendula Balm",
          imagePath: null,
          officialUrl: "https://www.auroraorganics.co/product/calendula-balm/",
          active: true,
        },
      ])

      await syncProductCatalog("postgres://fake", { dryRun: false })

      expect(fakeClientState.queries.some((q) => /^INSERT|^UPDATE "Product" SET name/i.test(q.sql))).toBe(false)
    })
  })

  describe("ingredient auto-recognition for new products", () => {
    it("recognizes real ingredients mentioned in unstructured description prose, including past the 500-char shortDescription cutoff, in the dry-run plan", async () => {
      vi.mocked(fetchWooCommerceProducts).mockResolvedValue([brighteningToneProduct])
      resetFakeClient([], TEST_VOCABULARY)

      const result = await syncProductCatalog("postgres://fake", { dryRun: true })

      expect(result.plans).toEqual([
        {
          action: "create",
          slug: "brightening-tone-toner",
          name: "Brightening Tone Toner",
          imageUrl: "https://www.auroraorganics.co/wp-content/uploads/2024/08/brightening-tone-toner.jpg",
          recognizedIngredients: ["Niacinamide", "Neem"],
        },
      ])
    })

    it("creates ProductIngredient rows for recognized ingredients and dual-writes the same names into keyIngredients", async () => {
      vi.mocked(fetchWooCommerceProducts).mockResolvedValue([brighteningToneProduct])
      resetFakeClient([], TEST_VOCABULARY)

      await syncProductCatalog("postgres://fake", { dryRun: false })

      const insertQuery = fakeClientState.queries.find((q) => /^INSERT INTO "Product"/i.test(q.sql))!
      const row = parseInsertProduct(insertQuery.sql, insertQuery.params)
      expect(JSON.parse(row.keyIngredients as string)).toEqual(["Niacinamide", "Neem"])

      const productIngredientInserts = fakeClientState.queries.filter((q) =>
        /^INSERT INTO "ProductIngredient"/i.test(q.sql),
      )
      expect(productIngredientInserts).toHaveLength(2)
      const linkedIngredientIds = productIngredientInserts.map((q) => q.params[2])
      expect(linkedIngredientIds.sort()).toEqual(["ingredient_neem", "ingredient_niacinamide"].sort())
      expect(fakeClientState.committed).toBe(true)
    })

    it("leaves keyIngredients null and creates no ProductIngredient rows when nothing in the vocabulary matches — never guesses", async () => {
      vi.mocked(fetchWooCommerceProducts).mockResolvedValue([normalInStockProduct])
      resetFakeClient([], TEST_VOCABULARY)

      const dryRunResult = await syncProductCatalog("postgres://fake", { dryRun: true })
      expect(dryRunResult.plans).toEqual([
        {
          action: "create",
          slug: "rosehip-face-oil",
          name: "Rosehip Face Oil",
          imageUrl: "https://www.auroraorganics.co/wp-content/uploads/2024/02/rosehip-face-oil.jpg",
          recognizedIngredients: [],
        },
      ])

      resetFakeClient([], TEST_VOCABULARY)
      await syncProductCatalog("postgres://fake", { dryRun: false })

      const insertQuery = fakeClientState.queries.find((q) => /^INSERT INTO "Product"/i.test(q.sql))!
      const row = parseInsertProduct(insertQuery.sql, insertQuery.params)
      expect(row.keyIngredients).toBeNull()
      expect(fakeClientState.queries.some((q) => /^INSERT INTO "ProductIngredient"/i.test(q.sql))).toBe(false)
    })

    it("never touches ingredients for an existing/curated product, even if its description now matches the vocabulary", async () => {
      vi.mocked(fetchWooCommerceProducts).mockResolvedValue([brighteningToneProduct])
      resetFakeClient(
        [
          {
            id: "product_9",
            slug: "brightening-tone-toner",
            name: "Brightening Tone Toner",
            shortDescription: "Old curated description.",
            imagePath: null,
            officialUrl: "https://www.auroraorganics.co/product/brightening-tone-toner/",
            active: true,
          },
        ],
        TEST_VOCABULARY,
      )

      await syncProductCatalog("postgres://fake", { dryRun: false })

      expect(fakeClientState.queries.some((q) => /^INSERT INTO "ProductIngredient"/i.test(q.sql))).toBe(false)
      const updateQuery = fakeClientState.queries.find((q) => /^UPDATE "Product"/i.test(q.sql))
      expect(updateQuery!.sql).not.toMatch(/keyIngredients/)
    })
  })

  describe("atomicity", () => {
    it("rolls back every write in the run if one product's write fails partway through, and never commits", async () => {
      vi.mocked(fetchWooCommerceProducts).mockResolvedValue([
        normalInStockProduct,
        outOfStockProduct,
        multipleImagesProduct,
      ])
      resetFakeClient([])
      // Both read-only SELECTs (Product, Ingredient vocabulary) happen
      // before BEGIN, outside the tx: index 0 = SELECT Product, 1 = SELECT
      // Ingredient, 2 = BEGIN, 3 = first INSERT, 4 = second INSERT (the one
      // we fail — this fixture's empty ingredient vocabulary means no
      // ProductIngredient inserts happen in between). Fail on the 2nd
      // Product INSERT to prove the whole batch — including the 1st INSERT
      // that already "succeeded" — rolls back together, not just the
      // failing product.
      fakeClientState.failOnIndex = 4

      await expect(syncProductCatalog("postgres://fake", { dryRun: false })).rejects.toThrow(
        "Simulated database failure mid-run",
      )

      expect(fakeClientState.committed).toBe(false)
      expect(fakeClientState.rolledBack).toBe(true)
      // A 3rd INSERT for multipleImagesProduct must never have been reached.
      const insertCount = fakeClientState.queries.filter((q) => /^INSERT INTO "Product"/i.test(q.sql)).length
      expect(insertCount).toBe(2)
    })
  })
})
