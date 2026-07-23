// One-time backfill: gives every existing user (created before the scan-
// credit feature existed) a starter ScanBalance of 10/10/0 plus a matching
// SIGNUP_BONUS ScanLedger entry — same shape lib/scans/balance.ts's
// grantSignupScans writes for a brand-new signup, just run in bulk here
// instead of per-user through the auth hook.
//
// Deliberately does NOT look at each user's past Scan rows — no retroactive
// debit for scans already taken. Every existing account gets a clean 10,
// same as a new signup, regardless of how many scans they've taken before
// this feature existed (see prisma/schema.prisma's ScanBalance doc comment
// and the PR discussion this script was written for).
//
// Raw `pg`, not Prisma Client, matching scripts/import_products.mjs's
// existing convention (no ts-node/tsx in this project to run a .ts script
// directly, and Prisma's generated client is TS source here, not
// pre-compiled JS — see that file's own .env.local-reading approach).
import fs from "node:fs"
import pg from "pg"

const envText = fs.readFileSync(".env.local", "utf8")
const url = envText
  .split("\n")
  .find((l) => l.startsWith("DATABASE_URL="))
  .slice("DATABASE_URL=".length)
  .trim()
  .replace(/^"|"$/g, "")

const STARTER_SCAN_CREDITS = 10

function createId(prefix) {
  const random = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${Date.now().toString(36)}_${random}`
}

async function main() {
  const client = new pg.Client({ connectionString: url })
  await client.connect()

  try {
    const { rows: missing } = await client.query(`
      SELECT "User".id
      FROM "User"
      LEFT JOIN "ScanBalance" ON "ScanBalance"."userId" = "User".id
      WHERE "ScanBalance".id IS NULL
    `)

    if (missing.length === 0) {
      console.log("No users are missing a ScanBalance row. Nothing to backfill.")
      return
    }

    console.log(`Backfilling starter scan credits for ${missing.length} user(s)...`)

    await client.query("BEGIN")
    try {
      for (const { id: userId } of missing) {
        await client.query(
          `INSERT INTO "ScanBalance" (id, "userId", remaining, "lifetimeGranted", "lifetimeUsed", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $3, 0, now(), now())`,
          [createId("scanbal"), userId, STARTER_SCAN_CREDITS],
        )
        await client.query(
          `INSERT INTO "ScanLedger" (id, "userId", delta, reason, "relatedScanId", "createdAt")
           VALUES ($1, $2, $3, 'SIGNUP_BONUS', NULL, now())`,
          [createId("scanledger"), userId, STARTER_SCAN_CREDITS],
        )
      }
      await client.query("COMMIT")
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    }

    console.log(`Backfilled ${missing.length} user(s) with ${STARTER_SCAN_CREDITS} starter scan credits each.`)
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
