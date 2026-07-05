import { redirect } from "next/navigation"

import { getAuthContext } from "@/lib/auth/context"

export async function ensureGuestAccess() {
  const ctx = await getAuthContext()
  if (ctx) {
    redirect("/scan")
  }
}

export async function AuthGuestShell({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  await ensureGuestAccess()
  return children
}
