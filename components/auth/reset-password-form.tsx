"use client"

// The emailed reset link hits better-auth's own /api/auth/reset-password/:token
// endpoint directly, which validates the token server-side and 302s here
// with either `?token=<valid>` or `?error=INVALID_TOKEN` — this form never
// sees the raw email link, only that redirect's outcome.
import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  IconAlertCircle,
  IconCircleCheck,
  IconEye,
  IconEyeOff,
  IconLoader2,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth/client"

const MIN_PASSWORD_LENGTH = 8

export function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const tokenInvalid = searchParams.get("error") === "INVALID_TOKEN" || !token

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle")

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match.")
      return
    }

    setStatus("loading")

    const { error: resetError } = await authClient.resetPassword({
      newPassword: password,
      token: token!,
    })

    if (resetError) {
      setStatus("idle")
      setError(
        resetError.message ??
          "Couldn't reset your password. Request a new link and try again."
      )
      return
    }

    setStatus("done")
  }

  if (tokenInvalid) {
    return (
      <div className="space-y-4 text-center">
        <IconAlertCircle className="mx-auto size-8 text-destructive" />
        <h1 className="text-xl font-medium">Link expired or invalid</h1>
        <p className="text-sm text-muted-foreground">
          Request a new password reset link and try again.
        </p>
        <Button asChild className="w-full">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </div>
    )
  }

  if (status === "done") {
    return (
      <div className="space-y-4 text-center">
        <IconCircleCheck className="mx-auto size-8 text-primary" />
        <h1 className="text-xl font-medium">Password updated</h1>
        <p className="text-sm text-muted-foreground">
          You can now sign in with your new password.
        </p>
        <Button asChild className="w-full">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2 text-center">
        <h1 className="text-xl font-medium">Set a new password</h1>
        <p className="text-sm text-muted-foreground">
          Choose a new password for your account.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              aria-invalid={Boolean(error)}
              className="pr-9"
              onChange={(event) => {
                setPassword(event.target.value)
                setError(null)
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute top-1/2 right-0 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <IconEyeOff className="size-4" />
              ) : (
                <IconEye className="size-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={confirmPassword}
            aria-invalid={Boolean(error)}
            onChange={(event) => {
              setConfirmPassword(event.target.value)
              setError(null)
            }}
          />
        </div>

        {error ? (
          <p
            className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            role="alert"
          >
            <IconAlertCircle className="size-4" />
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          className="w-full"
          disabled={status === "loading"}
        >
          {status === "loading" ? (
            <IconLoader2 className="size-4 animate-spin" />
          ) : null}
          Update password
        </Button>
      </form>
    </>
  )
}
