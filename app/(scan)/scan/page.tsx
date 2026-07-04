import { ScanWizard } from "@/components/scan/scan-wizard"
import { getSession } from "@/lib/auth/session"
import { getUserScanTier } from "@/lib/models/queries"

export default async function ScanPage() {
  const session = await getSession()
  const userScanTier = session
    ? await getUserScanTier(session.user.id)
    : "start"

  return <ScanWizard userScanTier={userScanTier} />
}
