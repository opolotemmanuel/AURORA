import { Suspense } from "react"

import { ResetPasswordForm } from "@/components/auth/reset-password-form"

// ResetPasswordForm reads `?token=`/`?error=` via useSearchParams, which
// requires a Suspense boundary (see the same note on the login page).
export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
