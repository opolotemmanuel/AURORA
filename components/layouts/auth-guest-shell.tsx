import { Suspense } from "react"
import { redirect } from "next/navigation"

import { getAuthContext } from "@/lib/auth/context"

async function AuthGuestGate({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const ctx = await getAuthContext()
  if (ctx) {
    redirect("/scan")
  }
  return children
}

function AuthGuestFallback() {
  return (
    <div className="text-muted-foreground flex min-h-svh items-center justify-center text-sm">
      Loading…
    </div>
  )
}

export function AuthGuestShell({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <Suspense fallback={<AuthGuestFallback />}>
      <AuthGuestGate>{children}</AuthGuestGate>
    </Suspense>
  )
}
