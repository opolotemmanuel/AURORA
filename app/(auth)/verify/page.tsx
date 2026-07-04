import { Suspense } from "react"

import { VerifyOtpForm } from "@/components/auth/verify-otp-form"

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
      <VerifyOtpForm />
    </Suspense>
  )
}
