import { ScanFlow } from "@/components/scan/ScanFlow"
import { getSession } from "@/lib/auth/session"
import { getRemainingScans } from "@/lib/scans/balance"

export const dynamic = "force-dynamic"

export default async function ScanStartPage() {
  const session = await getSession()
  // null means "no per-user allowance applies" (anonymous scanning is still
  // allowed, unmetered — see app/api/scan/analyze/route.ts) rather than
  // "zero remaining," so ScanFlow can tell the two apart.
  const scansRemaining = session ? await getRemainingScans(session.user.id) : null

  return <ScanFlow scansRemaining={scansRemaining} />
}
