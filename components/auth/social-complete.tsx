"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { ensureUserRecordsAction } from "@/lib/auth/post-sign-in"
import { getPostAuthRedirect } from "@/lib/auth/post-auth-redirect"
import { authClient } from "@/lib/auth/client"

function SocialCompleteInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") ?? "/onboarding"

  useEffect(() => {
    let cancelled = false

    async function complete() {
      const { data } = await authClient.getSession()

      if (!data?.user) {
        router.replace("/login")
        return
      }

      await ensureUserRecordsAction(
        data.user.id,
        data.user.email,
        data.user.name,
      )

      if (cancelled) return

      const destination =
        callbackUrl !== "/onboarding"
          ? callbackUrl
          : await getPostAuthRedirect(data.user.id)

      router.replace(destination)
      router.refresh()
    }

    void complete()

    return () => {
      cancelled = true
    }
  }, [callbackUrl, router])

  return (
    <div className="text-muted-foreground flex min-h-svh items-center justify-center text-sm">
      Completing sign in…
    </div>
  )
}

export function SocialComplete() {
  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground flex min-h-svh items-center justify-center text-sm">
          Loading…
        </div>
      }
    >
      <SocialCompleteInner />
    </Suspense>
  )
}
