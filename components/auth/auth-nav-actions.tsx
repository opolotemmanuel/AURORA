"use client"

// Sign-in/dashboard/logout buttons shown in the marketing nav — swaps based
// on client-side session state so the marketing page itself can stay a
// static/server component.
import Link from "next/link"
import { useRouter } from "next/navigation"
import { IconArrowRight } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth/client"

export function AuthNavActions() {
  const router = useRouter()
  const { data: session } = authClient.useSession()

  async function logout() {
    await authClient.signOut()
    router.push("/")
    // Server components (e.g. anything reading getSession()) won't know
    // the session is gone until the router cache is invalidated.
    router.refresh()
  }

  if (session) {
    return (
      <>
        <Button asChild variant="outline" size="lg">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
        <Button type="button" size="lg" onClick={logout}>
          Logout
        </Button>
      </>
    )
  }

  return (
    <Button asChild size="lg">
      <Link href="/login">
        Sign in
        <IconArrowRight className="size-4" />
      </Link>
    </Button>
  )
}
