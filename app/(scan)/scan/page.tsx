import { Suspense } from "react"

import { ScanWizard } from "@/components/scan/scan-wizard"

export default function ScanPage() {
  return (
    <Suspense fallback={null}>
      <ScanWizard />
    </Suspense>
  )
}
