"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { OTPInput } from "@/components/motion/otp-input"
import { Button } from "@/components/ui/button"
import { ensureUserRecordsAction } from "@/lib/auth/post-sign-in"
import { getPostAuthRedirect } from "@/lib/auth/post-auth-redirect"
import { authClient } from "@/lib/auth/client"

export function VerifyOtpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") ?? ""
  const mode = searchParams.get("mode") ?? "sign-in"
  const name = searchParams.get("name") ?? ""
  const callbackUrl = searchParams.get("callbackUrl") ?? "/onboarding"
  const [otp, setOtp] = useState("")
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function verifyCode(code: string) {
    if (!email) {
      setError("Missing email. Go back and try again.")
      setStatus("error")
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: signInError } = await authClient.signIn.emailOtp({
      email,
      otp: code,
      ...(mode === "sign-up" && name ? { name } : {}),
    })

    if (signInError) {
      setLoading(false)
      setError(signInError.message ?? "Invalid code. Try again.")
      setStatus("error")
      return
    }

    if (data?.user) {
      await ensureUserRecordsAction(data.user.id, data.user.email, data.user.name)
      const destination =
        callbackUrl !== "/onboarding"
          ? callbackUrl
          : await getPostAuthRedirect(data.user.id)
      setStatus("success")
      setLoading(false)
      router.push(destination)
      router.refresh()
      return
    }

    setStatus("success")
    setLoading(false)
    router.push(callbackUrl)
    router.refresh()
  }

  async function resend() {
    if (!email) return
    setError(null)
    await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" })
  }

  if (!email) {
    return (
      <div className="border-border bg-card space-y-4 rounded-lg border p-6 text-center">
        <p className="text-muted-foreground text-sm">No email provided.</p>
        <Button asChild>
          <a href="/login">Back to sign in</a>
        </Button>
      </div>
    )
  }

  return (
    <div className="border-border bg-card mx-auto w-full max-w-sm space-y-6 rounded-lg border p-6">
      <div className="space-y-2 text-center">
        <h1 className="font-heading text-xl font-medium">Verify code</h1>
        <p className="text-muted-foreground text-sm">
          Enter the 6-digit code sent to{" "}
          <span className="text-foreground">{email}</span>
        </p>
      </div>

      <OTPInput
        length={6}
        value={otp}
        onChange={setOtp}
        onComplete={verifyCode}
        status={status}
        errorMessage={error ?? undefined}
        disabled={loading}
        autoFocus
        label="Verification code"
        hint="Cosmetic wellness guidance only — not a medical diagnosis."
      />

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={loading || otp.length !== 6}
          onClick={() => verifyCode(otp)}
        >
          {loading ? "Verifying…" : "Verify"}
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={resend}>
          Resend code
        </Button>
      </div>
    </div>
  )
}
