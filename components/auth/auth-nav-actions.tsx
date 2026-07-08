"use client"

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
