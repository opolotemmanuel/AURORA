"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth/client"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") ?? "/onboarding"
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const { error: otpError } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "sign-in",
    })

    setLoading(false)

    if (otpError) {
      setError(otpError.message ?? "Could not send code. Try again.")
      return
    }

    const params = new URLSearchParams({ email, callbackUrl })
    router.push(`/verify?${params.toString()}`)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-lg border border-border bg-card p-6">
      <div className="space-y-2 text-center">
        <h1 className="font-heading text-xl font-medium">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send a one-time code.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Sending code…" : "Continue with email"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <a href="/forgot-password" className="underline underline-offset-4 hover:text-foreground">
          Forgot password?
        </a>
      </p>
    </form>
  )
}
