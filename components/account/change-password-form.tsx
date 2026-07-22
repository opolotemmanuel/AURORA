"use client"

// Real in-session password change via better-auth's changePassword API
// (authClient.changePassword) — separate capability from the signed-out
// /forgot-password email-reset-link flow, which stays as-is for recovery.
// Requires the current password (verified server-side against the real
// AuthAccount hash, see better-auth's dist/api/routes/update-user.mjs),
// never just trusted from client state.
import { useState } from "react"
import { IconAlertCircle, IconCircleCheck, IconLoader2 } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth/client"

const MIN_PASSWORD_LENGTH = 8 // Mirrors lib/auth/auth.ts's emailAndPassword.minPasswordLength.

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(false)

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation don't match.")
      return
    }

    setIsSubmitting(true)
    const { error: changeError } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    })
    setIsSubmitting(false)

    if (changeError) {
      setError(changeError.message ?? "Couldn't change your password. Check your current password and try again.")
      return
    }

    setSuccess(true)
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="current-password">Current password</Label>
        <Input
          id="current-password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => {
            setCurrentPassword(event.target.value)
            setError(null)
          }}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => {
            setNewPassword(event.target.value)
            setError(null)
          }}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-new-password">Confirm new password</Label>
        <Input
          id="confirm-new-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value)
            setError(null)
          }}
          required
        />
      </div>

      {error ? (
        <p role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <IconAlertCircle className="size-4 shrink-0" />
          {error}
        </p>
      ) : null}

      {success ? (
        <p role="status" className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">
          <IconCircleCheck className="size-4 shrink-0" />
          Password changed. Your other sessions have been signed out.
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <IconLoader2 className="size-4 animate-spin" /> : null}
        Change password
      </Button>
    </form>
  )
}
