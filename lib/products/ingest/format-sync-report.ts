// Pure formatting for the sync CLI's console output (scripts/sync-products.ts).
// No I/O here so it's cheap to test against fixtures — see
// format-sync-report.test.ts. Groups by action so a reviewer scans "what's
// changing" instead of hunting through products in WooCommerce feed order.
import type { CatalogSyncResult, FieldChange, ProductSyncPlan } from "./types.ts"

function formatValue(value: string | null): string {
  return value === null ? "(empty)" : JSON.stringify(value)
}

function formatChange(change: FieldChange): string {
  return `      ${change.field}: ${formatValue(change.from)} -> ${formatValue(change.to)}`
}

export function formatSyncReport(result: CatalogSyncResult): string {
  const creates = result.plans.filter((plan): plan is Extract<ProductSyncPlan, { action: "create" }> => plan.action === "create")
  const updates = result.plans.filter((plan): plan is Extract<ProductSyncPlan, { action: "update" }> => plan.action === "update")
  const deactivates = result.plans.filter((plan): plan is Extract<ProductSyncPlan, { action: "deactivate" }> => plan.action === "deactivate")
  const unchangedCount = result.plans.filter((plan) => plan.action === "unchanged").length

  const addLabel = result.dryRun ? "WOULD ADD" : "ADDED"
  const updateLabel = result.dryRun ? "WOULD UPDATE" : "UPDATED"
  const deactivateLabel = result.dryRun ? "WOULD DEACTIVATE" : "DEACTIVATED"

  const lines: string[] = [
    result.dryRun ? "DRY RUN — no database writes will happen." : "LIVE RUN — changes below were applied.",
    "",
  ]

  if (creates.length > 0) {
    lines.push(`${addLabel} (${creates.length})`)
    for (const plan of creates) {
      lines.push(`  + ${plan.slug} — "${plan.name}"`)
      lines.push(`      placeholder curated fields (needsCuration = true, active = false — needs human review)`)
      lines.push(
        plan.recognizedIngredients.length > 0
          ? `      ingredients recognized: ${plan.recognizedIngredients.join(", ")}`
          : `      ingredients recognized: none (leave blank for manual curation)`,
      )
      if (plan.imageUrl) lines.push(`      image: ${plan.imageUrl} -> public/products/${plan.slug}.*`)
    }
    lines.push("")
  }

  if (updates.length > 0) {
    lines.push(`${updateLabel} (${updates.length})`)
    for (const plan of updates) {
      lines.push(`  ~ ${plan.slug} — "${plan.name}"`)
      for (const change of plan.changes) {
        lines.push(formatChange(change))
      }
    }
    lines.push("")
  }

  if (deactivates.length > 0) {
    lines.push(`${deactivateLabel} (${deactivates.length})`)
    for (const plan of deactivates) {
      lines.push(`  - ${plan.slug} — "${plan.name}" (no longer in the WooCommerce feed — deactivated, not deleted)`)
    }
    lines.push("")
  }

  if (creates.length === 0 && updates.length === 0 && deactivates.length === 0) {
    lines.push("No changes.")
    lines.push("")
  }

  lines.push(
    `Summary: ${creates.length} to add, ${updates.length} to update, ${deactivates.length} to deactivate, ${unchangedCount} unchanged (${result.total} products fetched from WooCommerce).`,
  )

  return lines.join("\n")
}
