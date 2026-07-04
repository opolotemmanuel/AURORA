"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { completeSignInAction } from "@/lib/auth/post-sign-in"
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

      const destination = await completeSignInAction(
        data.user.id,
        data.user.email,
        data.user.name,
        callbackUrl,
      )

      if (cancelled) return

      router.replace(destination)
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
