import { Suspense } from "react"

import { LoginForm } from "@/components/auth/login-form"

// LoginForm reads `?verified=1` via useSearchParams, which requires a
// Suspense boundary so the rest of the route can still prerender (see
// Next's useSearchParams docs).
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
