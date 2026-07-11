"use client"

// Real sign-up flow (replaces the old OTP-implicit-signup). Email
// verification is currently OFF (see lib/auth/auth.ts's
// requireEmailVerification TODO — temporary, until a verified sending
// domain exists in Resend), so a successful sign-up already comes back
// signed in (autoSignIn: true) and this redirects straight to /dashboard.
// The "check your email" state below is kept but currently unreachable —
// intentionally not deleted, so re-enabling verification later is just
// flipping the config back, not rebuilding this screen.
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  IconAlertCircle,
  IconEye,
  IconEyeOff,
  IconLoader2,
  IconMailCheck,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth/client"

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

export function RegisterForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle")

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError("Enter your name.")
      return
    }

    if (!emailPattern.test(email)) {
      setError("Enter a valid email address.")
      return
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match.")
      return
    }

    setStatus("loading")

    const { error: signUpError } = await authClient.signUp.email({
      name: name.trim(),
      email,
      password,
    })

    if (signUpError) {
      setStatus("idle")
      setError(
        signUpError.message ?? "Couldn't create your account. Try again."
      )
      return
    }

    router.push("/dashboard")
    // Server components (e.g. anything reading getSession()) won't know
    // the session exists until the router cache is invalidated.
    router.refresh()
  }

  if (status === "sent") {
    return (
      <div className="space-y-4 text-center">
        <IconMailCheck className="mx-auto size-8 text-primary" />
        <h1 className="text-xl font-medium">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          We sent a verification link to{" "}
          <span className="font-medium text-foreground">{email}</span>. Click it
          to finish setting up your account.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2 text-center">
        <h1 className="text-xl font-medium">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          Start your AI skin intelligence journey.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            aria-invalid={Boolean(error)}
            onChange={(event) => {
              setName(event.target.value)
              setError(null)
            }}
          />
        </div>

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

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
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
          <Label htmlFor="confirmPassword">Confirm password</Label>
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
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </>
  )
}
