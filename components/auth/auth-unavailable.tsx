"use client"

// Shown by app/(dashboard)/layout.tsx and app/(scan)/layout.tsx in place of
// their normal "redirect to /login" when resolveSession() (lib/auth/
// resolve-session.ts) reports db_unavailable — a signed-in user hitting a
// transient DB outage, not someone who's actually logged out. Reloading is
// enough to recover once the DB answers again; there's no local state here
// worth preserving on retry.
import { useTransition } from "react"
import { IconRefresh } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function AuthUnavailable() {
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle>Reconnecting</CardTitle>
          <CardDescription>
            Aurora Organics couldn&apos;t reach the database just now. This is usually
            temporary — try again in a few seconds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            className="w-full"
            disabled={pending}
            onClick={() => {
              startTransition(() => {
                window.location.reload()
              })
            }}
          >
            <IconRefresh className={pending ? "size-4 animate-spin" : "size-4"} />
            {pending ? "Retrying…" : "Try again"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
