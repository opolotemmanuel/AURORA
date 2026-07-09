// login-form.tsx navigates here with ?email=... after sending the code —
// arriving without that param means this page was reached out of sequence
// (direct link, refresh after navigating away, etc.), so send the user back
// to start the sign-in flow properly.
import { redirect } from "next/navigation"

import { VerifyForm } from "@/components/auth/verify-form"

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams

  if (!email) {
    redirect("/login")
  }

  return <VerifyForm email={email} />
}
