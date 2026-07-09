"use client"

// Step 1 of the email-OTP sign-in flow: collect an email, ask better-auth
// to send a one-time code, then hand off to /verify (components/auth/verify-form.tsx)
// with the email carried in the query string.
import { useState } from "react"
import { useRouter } from "next/navigation"
import { IconAlertCircle, IconLoader2 } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth/client"

// Client-side shape check only, to avoid a round-trip for an obviously bad
// address — better-auth still validates/normalizes the email server-side.
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "loading">("idle")

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!emailPattern.test(email)) {
      setError("Enter a valid email address.")
      return
    }

    setStatus("loading")

    const { error: sendError } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "sign-in",
    })

    setStatus("idle")

    if (sendError) {
      setError(sendError.message ?? "Could not send a code. Try again.")
      return
    }

    router.push(`/verify?email=${encodeURIComponent(email)}`)
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="space-y-2 text-center">
        <h1 className="text-xl font-medium">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a one-time code.
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
          <p className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
            <IconAlertCircle className="size-4" />
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={status === "loading"}>
          {status === "loading" ? <IconLoader2 className="size-4 animate-spin" /> : null}
          Send code
        </Button>
      </form>
    </div>
  )
}
