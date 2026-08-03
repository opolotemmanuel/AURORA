"use client"

// Real in-session name update via better-auth's updateUser API
// (authClient.updateUser({ name })) — same trust model as
// components/account/change-password-form.tsx's authClient.changePassword:
// the actual mutation is a POST to better-auth's own /update-user
// endpoint (node_modules/better-auth/dist/api/routes/update-user.mjs),
// whose middleware re-verifies the session server-side from the request's
// own session cookie, never from anything the client claims. A successful
// call also flips better-auth's $sessionSignal atom (see
// node_modules/better-auth/dist/client/config.mjs's atomListeners —
// "/update-user" is one of the matched paths), which is what makes every
// authClient.useSession() consumer — including the sidebar's profile
// card — pick up the new name on its own, no manual prop-passing needed.
import { useState } from "react"
import { useRouter } from "next/navigation"
import { IconAlertCircle, IconCircleCheck, IconLoader2 } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth/client"

export function EditNameForm({ initialName }: { initialName: string }) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(false)

    const trimmed = name.trim()
    if (!trimmed) {
      setError("Name can't be empty.")
      return
    }

    setIsSubmitting(true)
    const { error: updateError } = await authClient.updateUser({ name: trimmed })
    setIsSubmitting(false)

    if (updateError) {
      setError(updateError.message ?? "Couldn't update your name. Try again.")
      return
    }

    setName(trimmed)
    setSuccess(true)
    // /profile itself is a Server Component that read the old name at
    // request time — refresh it so "Account details" reflects the new
    // value immediately too (the sidebar already updates on its own via
    // the session signal described above).
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            setError(null)
            setSuccess(false)
          }}
          required
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <IconAlertCircle className="size-4 shrink-0" />
          {error}
        </p>
      ) : null}

      {success ? (
        <p
          role="status"
          className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary"
        >
          <IconCircleCheck className="size-4 shrink-0" />
          Name updated.
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <IconLoader2 className="size-4 animate-spin" /> : null}
        Save name
      </Button>
    </form>
  )
}
