// Per-user free-scan credit balance and its ledger — see prisma/schema.prisma's
// ScanBalance/ScanLedger doc comments for the full design rationale
// (separate table, same pattern as DoshaProfile; independent of the shared
// Gemini API quota, never conflate the two).
import { prisma } from "@/lib/db"
import { ScanLedgerReason } from "@/lib/generated/prisma/enums"

export const STARTER_SCAN_CREDITS = 10

export type ScanBalanceSnapshot = {
  remaining: number
  lifetimeGranted: number
  lifetimeUsed: number
}

export type ScanLedgerEntry = {
  id: string
  delta: number
  reason: "signup_bonus" | "scan_debit" | "admin_grant"
  relatedScanId: string | null
  createdAt: string
}

// Grants the one-time starter balance — called from lib/auth/auth.ts's
// databaseHooks.user.create.after on every new signup (email/password or
// social alike), and defensively from getOrCreateScanBalance below for any
// user who reaches a balance check without one (pre-migration backfill
// gap, or any other path that created a User row without going through
// that hook). Idempotent: a user who already has a ScanBalance row is left
// completely untouched, never re-granted or topped back up.
export async function grantSignupScans(userId: string): Promise<void> {
  const existing = await prisma.scanBalance.findUnique({ where: { userId } })
  if (existing) return

  try {
    await prisma.$transaction([
      prisma.scanBalance.create({
        data: {
          userId,
          remaining: STARTER_SCAN_CREDITS,
          lifetimeGranted: STARTER_SCAN_CREDITS,
          lifetimeUsed: 0,
        },
      }),
      prisma.scanLedger.create({
        data: { userId, delta: STARTER_SCAN_CREDITS, reason: ScanLedgerReason.SIGNUP_BONUS },
      }),
    ])
  } catch (error) {
    // Unique constraint race (P2002) — a concurrent call already granted
    // this user's starter balance between the findUnique above and this
    // create; nothing left to do.
    if (!isUniqueConstraintError(error)) throw error
  }
}

// Self-healing read: any signed-in user who somehow reaches this without a
// ScanBalance row (the pre-migration backfill script covers existing users
// in bulk; this covers the gap for anyone who slips through it) gets one
// granted on the spot, same starter amount, same ledger entry — rather
// than treating a missing row as "0 remaining" and locking them out.
export async function getOrCreateScanBalance(userId: string): Promise<ScanBalanceSnapshot> {
  const existing = await prisma.scanBalance.findUnique({ where: { userId } })
  if (existing) return existing

  await grantSignupScans(userId)

  const balance = await prisma.scanBalance.findUnique({ where: { userId } })
  // Cannot actually be null here: grantSignupScans either created the row
  // itself or, on a P2002 race, a concurrent call did — either way a row
  // now exists for this userId.
  return balance!
}

export async function getRemainingScans(userId: string): Promise<number> {
  const balance = await getOrCreateScanBalance(userId)
  return balance.remaining
}

// Debits exactly one credit for a scan that reached a real, completed
// outcome (a Scan/Report row actually got created — see
// lib/backend/scan-service.ts's createScanReport, the only caller). Guards
// the decrement with `remaining: { gt: 0 }` and only writes the ledger
// entry if that guard actually matched a row — defense in depth against
// two concurrent requests both passing app/api/scan/analyze/route.ts's
// pre-check at once; the route-level check is the real gate, this just
// stops the balance from ever reading negative under that narrow race.
export async function debitScanCredit(userId: string, scanId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const result = await tx.scanBalance.updateMany({
      where: { userId, remaining: { gt: 0 } },
      data: { remaining: { decrement: 1 }, lifetimeUsed: { increment: 1 } },
    })

    if (result.count === 0) return

    await tx.scanLedger.create({
      data: { userId, delta: -1, reason: ScanLedgerReason.SCAN_DEBIT, relatedScanId: scanId },
    })
  })
}

export async function getRecentLedgerForUser(userId: string, limit = 10): Promise<ScanLedgerEntry[]> {
  const rows = await prisma.scanLedger.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  })

  return rows.map(mapLedgerEntry)
}

function mapLedgerEntry(row: {
  id: string
  delta: number
  reason: string
  relatedScanId: string | null
  createdAt: Date
}): ScanLedgerEntry {
  return {
    id: row.id,
    delta: row.delta,
    reason: fromPrismaReason(row.reason),
    relatedScanId: row.relatedScanId,
    createdAt: row.createdAt.toISOString(),
  }
}

function fromPrismaReason(reason: string): ScanLedgerEntry["reason"] {
  switch (reason) {
    case ScanLedgerReason.SIGNUP_BONUS:
      return "signup_bonus"
    case ScanLedgerReason.SCAN_DEBIT:
      return "scan_debit"
    case ScanLedgerReason.ADMIN_GRANT:
      return "admin_grant"
    default:
      return "admin_grant"
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002")
}
