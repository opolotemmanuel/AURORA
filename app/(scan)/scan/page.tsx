import { Suspense } from "react"

import { ScanWizard } from "@/components/scan/scan-wizard"
import { requireAuthContext } from "@/lib/auth/context"
import { getUserScanTier } from "@/lib/models/queries"

export default async function ScanPage() {
  const ctx = await requireAuthContext()
  const scanTier = await getUserScanTier(ctx.userId)

  return (
    <Suspense fallback={null}>
      <ScanWizard scanTier={scanTier} />
    </Suspense>
  )
}
