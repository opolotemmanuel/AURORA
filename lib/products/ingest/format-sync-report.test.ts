import { describe, expect, it } from "vitest"

import { formatSyncReport } from "./format-sync-report.ts"
import type { CatalogSyncResult } from "./types.ts"

const SAMPLE_RESULT: CatalogSyncResult = {
  dryRun: true,
  total: 5,
  created: 1,
  updated: 2,
  deactivated: 1,
  unchanged: 1,
  plans: [
    {
      action: "create",
      slug: "vitamin-c-serum",
      name: "Vitamin C Serum",
      imageUrl: "https://example.com/vc.jpg",
      recognizedIngredients: ["Niacinamide"],
    },
    {
      action: "update",
      slug: "rosehip-face-oil",
      name: "Rosehip Face Oil",
      imageUrl: "https://example.com/rho.jpg",
      changes: [
        { field: "name", from: "Rosehip Oil", to: "Rosehip Face Oil" },
        { field: "officialUrl", from: null, to: "https://www.auroraorganics.co/product/rosehip-face-oil/" },
      ],
    },
    {
      action: "update",
      slug: "kaolin-clay-mask",
      name: "Kaolin Clay Mask",
      changes: [{ field: "imagePath", from: null, to: "/products/kaolin-clay-mask.jpg" }],
    },
    { action: "deactivate", slug: "discontinued-toner", name: "Discontinued Toner" },
    { action: "unchanged", slug: "calendula-balm", name: "Calendula Balm" },
  ],
}

describe("formatSyncReport", () => {
  it("groups plans by action with a header per group, in ADD -> UPDATE -> DEACTIVATE order", () => {
    const report = formatSyncReport(SAMPLE_RESULT)
    const addIndex = report.indexOf("WOULD ADD (1)")
    const updateIndex = report.indexOf("WOULD UPDATE (2)")
    const deactivateIndex = report.indexOf("WOULD DEACTIVATE (1)")

    expect(addIndex).toBeGreaterThanOrEqual(0)
    expect(updateIndex).toBeGreaterThan(addIndex)
    expect(deactivateIndex).toBeGreaterThan(updateIndex)
  })

  it("shows a before/after diff line for every changed field, not just the product name", () => {
    const report = formatSyncReport(SAMPLE_RESULT)

    expect(report).toContain('name: "Rosehip Oil" -> "Rosehip Face Oil"')
    expect(report).toContain('officialUrl: (empty) -> "https://www.auroraorganics.co/product/rosehip-face-oil/"')
    expect(report).toContain('imagePath: (empty) -> "/products/kaolin-clay-mask.jpg"')
  })

  it("shows which ingredients were auto-recognized for a new product, or that none were", () => {
    const withMatch = formatSyncReport(SAMPLE_RESULT)
    expect(withMatch).toContain("ingredients recognized: Niacinamide")

    const withoutMatch = formatSyncReport({
      ...SAMPLE_RESULT,
      plans: SAMPLE_RESULT.plans.map((plan) =>
        plan.action === "create" ? { ...plan, recognizedIngredients: [] } : plan,
      ),
    })
    expect(withoutMatch).toContain("ingredients recognized: none (leave blank for manual curation)")
  })

  it("does not list every unchanged product individually, only its count in the summary", () => {
    const report = formatSyncReport(SAMPLE_RESULT)

    expect(report).not.toContain("calendula-balm")
    expect(report).toContain("1 unchanged")
  })

  it("labels the deactivation as non-destructive", () => {
    const report = formatSyncReport(SAMPLE_RESULT)

    expect(report).toContain("discontinued-toner")
    expect(report).toContain("deactivated, not deleted")
  })

  it("ends with a summary line with all four counts and the total fetched", () => {
    const report = formatSyncReport(SAMPLE_RESULT)

    expect(report.trim().endsWith(
      "Summary: 1 to add, 2 to update, 1 to deactivate, 1 unchanged (5 products fetched from WooCommerce).",
    )).toBe(true)
  })

  it("uses WOULD-prefixed labels for a dry run and past-tense labels for a live run", () => {
    const dryReport = formatSyncReport({ ...SAMPLE_RESULT, dryRun: true })
    const liveReport = formatSyncReport({ ...SAMPLE_RESULT, dryRun: false })

    expect(dryReport).toContain("DRY RUN")
    expect(dryReport).toContain("WOULD ADD")
    expect(liveReport).toContain("LIVE RUN")
    expect(liveReport).toContain("ADDED (1)")
    expect(liveReport).not.toContain("WOULD ADD")
  })

  it("prints a clear no-op message when nothing would change", () => {
    const noopResult: CatalogSyncResult = {
      dryRun: true,
      total: 3,
      created: 0,
      updated: 0,
      deactivated: 0,
      unchanged: 3,
      plans: [
        { action: "unchanged", slug: "a", name: "A" },
        { action: "unchanged", slug: "b", name: "B" },
        { action: "unchanged", slug: "c", name: "C" },
      ],
    }

    expect(formatSyncReport(noopResult)).toContain("No changes.")
  })
})
