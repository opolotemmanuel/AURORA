"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { OTPInput } from "@/components/motion/otp-input"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth/client"

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") ?? ""
  const [otp, setOtp] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    if (!email || otp.length !== 6) {
      setError("Enter the code from your email.")
      return
    }

    setLoading(true)
    const { error: resetError } = await authClient.emailOtp.resetPassword({
      email,
      otp,
      password,
    })
    setLoading(false)

    if (resetError) {
      setError(resetError.message ?? "Could not reset password.")
      return
    }

    router.push("/login")
  }

  if (!email) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        <a href="/forgot-password" className="underline">
          Request a reset code first
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-lg border border-border bg-card p-6">
      <div className="space-y-2 text-center">
        <h1 className="font-heading text-xl font-medium">Reset password</h1>
        <p className="text-sm text-muted-foreground">For {email}</p>
      </div>

      <OTPInput
        length={6}
        value={otp}
        onChange={setOtp}
        label="Reset code"
        disabled={loading}
        autoFocus
      />

      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          type="password"
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          type="password"
          minLength={8}
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Saving…" : "Reset password"}
      </Button>
    </form>
  )
}
