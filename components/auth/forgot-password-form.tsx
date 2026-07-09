"use client"

// Requests a password-reset email. better-auth's client method name is
// derived from its server path (`/request-password-reset` ->
// `requestPasswordReset`) — verified against the installed package's
// path-to-object client generator, not assumed from memory.
import { useState } from "react"
import Link from "next/link"
import {
  IconAlertCircle,
  IconLoader2,
  IconMailCheck,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth/client"

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle")

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!emailPattern.test(email)) {
      setError("Enter a valid email address.")
      return
    }

    setStatus("loading")

    const { error: requestError } = await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    })

    // Always show the "check your email" state on success, even if the
    // account doesn't exist — a different response would let a caller
    // enumerate which emails are registered.
    if (requestError) {
      setStatus("idle")
      setError(requestError.message ?? "Couldn't send a reset link. Try again.")
      return
    }

    setStatus("sent")
  }

  if (status === "sent") {
    return (
      <div className="space-y-4 rounded-lg border border-border bg-card p-6 text-center shadow-sm">
        <IconMailCheck className="mx-auto size-8 text-primary" />
        <h1 className="text-xl font-medium">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          If an account exists for{" "}
          <span className="font-medium text-foreground">{email}</span>, we sent
          a link to reset your password.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="space-y-2 text-center">
        <h1 className="text-xl font-medium">Reset your password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a link to reset your
          password.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            aria-invalid={Boolean(error)}
            onChange={(event) => {
              setEmail(event.target.value)
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
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remembered your password?{" "}
        <Link
          href="/login"
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
