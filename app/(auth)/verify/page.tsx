import { Suspense } from "react"

import { VerifyOtpForm } from "@/components/auth/verify-otp-form"

export default function VerifyPage() {
  return (
    <div className="flex min-h-svh items-center justify-center px-6 py-12">
      <Suspense
        fallback={
          <div className="text-muted-foreground text-sm">Loading…</div>
        }
      >
        <VerifyOtpForm />
      </Suspense>
    </div>
  )
}
