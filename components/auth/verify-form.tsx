"use client"

// Step 2 of the email-OTP sign-in flow: enter the code sent by
// login-form.tsx and exchange it for a real session via better-auth.
import { useState } from "react"
import { useRouter } from "next/navigation"
import { IconAlertCircle, IconLoader2 } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { authClient } from "@/lib/auth/client"

const OTP_LENGTH = 6

export function VerifyForm({ email }: { email: string }) {
  const router = useRouter()
  const [otp, setOtp] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "verifying" | "resending">("idle")
  const [resent, setResent] = useState(false)

  async function verify(code: string) {
    setError(null)
    setStatus("verifying")

    const { error: verifyError } = await authClient.signIn.emailOtp({
      email,
      otp: code,
    })

    if (verifyError) {
      setStatus("idle")
      setOtp("")
      setError(verifyError.message ?? "That code didn't work. Try again.")
      return
    }

    router.push("/dashboard")
  }

  async function resend() {
    setError(null)
    setResent(false)
    setStatus("resending")

    const { error: sendError } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "sign-in",
    })

    setStatus("idle")

    if (sendError) {
      setError(sendError.message ?? "Could not resend the code. Try again.")
      return
    }

    setResent(true)
  }

  return (
    <div className="space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="space-y-2 text-center">
        <h1 className="text-xl font-medium">Enter your code</h1>
        <p className="text-sm text-muted-foreground">
          We sent a {OTP_LENGTH}-digit code to <span className="font-medium text-foreground">{email}</span>.
        </p>
      </div>

      <div className="flex justify-center">
        <InputOTP
          maxLength={OTP_LENGTH}
          value={otp}
          onChange={(value) => {
            setOtp(value)
            setError(null)
          }}
          // Auto-submits as soon as all digits are entered — the "Verify
          // and continue" button below is a fallback for anyone who edits
          // a digit after typing the last one (which doesn't re-fire
          // onComplete).
          onComplete={verify}
          disabled={status === "verifying"}
        >
          <InputOTPGroup>
            {Array.from({ length: OTP_LENGTH }).map((_, index) => (
              <InputOTPSlot key={index} index={index} aria-invalid={Boolean(error)} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      {error ? (
        <p className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          <IconAlertCircle className="size-4" />
          {error}
        </p>
      ) : null}

      {resent && !error ? (
        <p className="text-center text-sm text-muted-foreground" role="status">
          A new code is on its way.
        </p>
      ) : null}

      <Button
        type="button"
        className="w-full"
        disabled={status === "verifying" || otp.length !== OTP_LENGTH}
        onClick={() => verify(otp)}
      >
        {status === "verifying" ? <IconLoader2 className="size-4 animate-spin" /> : null}
        Verify and continue
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Didn&apos;t get a code?{" "}
        <button
          type="button"
          className="font-medium text-primary hover:underline disabled:pointer-events-none disabled:opacity-50"
          onClick={resend}
          disabled={status === "resending"}
        >
          Resend
        </button>
      </p>
    </div>
  )
}
