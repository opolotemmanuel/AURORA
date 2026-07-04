import { Suspense } from "react"

import { AuthForm } from "@/components/auth/auth-form"

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground flex min-h-svh items-center justify-center text-sm">
          Loading…
        </div>
      }
    >
      <AuthForm mode="sign-up" />
    </Suspense>
  )
}
