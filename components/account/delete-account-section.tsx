"use client"

// Real, irreversible self-service account deletion — three deliberate
// friction points before anything happens: (1) an AlertDialog spelling out
// exactly what gets deleted, (2) typing the account's own email to enable
// the delete button, (3) re-entering the current password, which
// authClient.deleteUser sends to better-auth's /delete-user endpoint for
// real server-side verification against the AuthAccount hash — never
// trusted from client state. See lib/auth/auth.ts's user.deleteUser
// config for the beforeDelete hook that cascades the actual data removal
// (Scan/Report/etc.) before better-auth deletes the User row itself.
import { useState } from "react"
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconLoader2,
} from "@tabler/icons-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth/client"

// Full-page redirect after deletion (not next/router) — the session cookie
// is gone and every client-side auth/session cache needs to reset, not
// soft-navigate with stale state still in memory.
const POST_DELETE_REDIRECT = "/?accountDeleted=1"

export function DeleteAccountSection({ email }: { email: string }) {
  const [open, setOpen] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const emailMatches = confirmEmail.trim().toLowerCase() === email.trim().toLowerCase()
  const canSubmit = emailMatches && password.length > 0 && !isDeleting

  function resetForm() {
    setConfirmEmail("")
    setPassword("")
    setError(null)
  }

  async function handleDelete() {
    if (!canSubmit) return

    setError(null)
    setIsDeleting(true)

    const { error: deleteError } = await authClient.deleteUser({
      password,
      callbackURL: POST_DELETE_REDIRECT,
    })

    if (deleteError) {
      setIsDeleting(false)
      setError(deleteError.message ?? "Couldn't delete your account. Check your password and try again.")
      return
    }

    window.location.href = POST_DELETE_REDIRECT
  }

  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardHeader>
        <CardTitle className="text-destructive">Delete your account</CardTitle>
        <CardDescription>
          Permanently remove your account and everything tied to it. This cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog
          open={open}
          onOpenChange={(next) => {
            if (isDeleting) return
            setOpen(next)
            if (!next) resetForm()
          }}
        >
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <IconAlertTriangle className="size-4" />
              Delete my account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>This will permanently delete your account</AlertDialogTitle>
              <AlertDialogDescription>
                This deletes <span className="font-medium text-foreground">{email}</span> and everything tied to
                it: all skin scans, reports and cosmetic findings, product recommendations, report chat and skin
                advice chat history, and your dosha profile. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="delete-confirm-email">
                  Type <span className="font-medium text-foreground">{email}</span> to confirm
                </Label>
                <Input
                  id="delete-confirm-email"
                  value={confirmEmail}
                  autoComplete="off"
                  onChange={(event) => {
                    setConfirmEmail(event.target.value)
                    setError(null)
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="delete-confirm-password">Enter your current password</Label>
                <Input
                  id="delete-confirm-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setError(null)
                  }}
                />
              </div>

              {error ? (
                <p role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <IconAlertCircle className="size-4 shrink-0" />
                  {error}
                </p>
              ) : null}
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={!canSubmit}
                onClick={(event) => {
                  event.preventDefault()
                  handleDelete()
                }}
              >
                {isDeleting ? <IconLoader2 className="size-4 animate-spin" /> : null}
                Permanently delete my account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
