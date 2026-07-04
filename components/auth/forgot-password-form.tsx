"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth/client"

export function ForgotPasswordForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const { error: resetError } = await authClient.emailOtp.requestPasswordReset({ email })

    setLoading(false)

    if (resetError) {
      setError(resetError.message ?? "Could not send reset code.")
      return
    }

    router.push(`/reset-password?email=${encodeURIComponent(email)}`)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-lg border border-border bg-card p-6">
      <div className="space-y-2 text-center">
        <h1 className="font-heading text-xl font-medium">Forgot password</h1>
        <p className="text-sm text-muted-foreground">
          We&apos;ll email you a code to reset your password.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Sending…" : "Send reset code"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <a href="/login" className="underline underline-offset-4 hover:text-foreground">
          Back to sign in
        </a>
      </p>
    </form>
  )
}
