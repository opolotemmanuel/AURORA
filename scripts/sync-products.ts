// Manual product catalog sync — run via `npm run sync:products -- --dry-run`
// or `npm run sync:products` for real. Not on a schedule: new WooCommerce-
// only products land with placeholder curated fields (needsCuration = true)
// that need a human to review before they're useful, so an unattended cron
// would just quietly pile those up. Revisit once there's a review workflow.
//
// Reads .env.local by hand (like scripts/import_products.mjs) rather than
// Node's --env-file flag: this project's .env.local uses `KEY = value`
// (spaces around `=`), which --env-file's stricter parser does not accept.
import { readFileSync } from "node:fs"

import { formatSyncReport } from "../lib/products/ingest/format-sync-report.ts"
import { syncProductCatalog } from "../lib/products/ingest/sync-catalog.ts"

function readEnvVar(name: string): string {
  const envText = readFileSync(".env.local", "utf8")
  const line = envText.split("\n").find((entry) => entry.trim().startsWith(`${name}`))
  if (!line) {
    throw new Error(`${name} not found in .env.local`)
  }

  return line
    .slice(line.indexOf("=") + 1)
    .trim()
    .replace(/^"|"$/g, "")
}

async function main() {
  const dryRun = process.argv.includes("--dry-run")
  const databaseUrl = readEnvVar("DATABASE_URL")

  const result = await syncProductCatalog(databaseUrl, { dryRun })

  console.log(formatSyncReport(result))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
