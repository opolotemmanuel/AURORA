import { Suspense } from "react"

import { ScanWizard } from "@/components/scan/scan-wizard"
import { getSession } from "@/lib/auth/session"
import { getUserScanTier } from "@/lib/models/queries"

async function ScanWizardLoader() {
  const session = await getSession()
  const userScanTier = session
    ? await getUserScanTier(session.user.id)
    : "start"

  return <ScanWizard userScanTier={userScanTier} />
}

export default function ScanPage() {
  return (
    <Suspense fallback={null}>
      <ScanWizardLoader />
    </Suspense>
  )
}
