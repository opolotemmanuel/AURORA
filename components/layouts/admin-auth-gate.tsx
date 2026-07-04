import { redirect } from "next/navigation"

import { getAuthContext } from "@/lib/auth/context"

export async function AdminAuthGate({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const ctx = await getAuthContext()
  if (!ctx) {
    redirect("/login")
  }
  if (ctx.role !== "admin") {
    redirect("/dashboard")
  }
  return children
}
