"use client"

// Email+password sign-in. Apple is rendered as a second option
// (authClient.signIn.social) but stays inert until real credentials are
// configured server-side (see lib/auth/auth.ts's conditional
// socialProviders.apple block) — clicking it before then just surfaces
// better-auth's "provider not configured" error.
import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  IconAlertCircle,
  IconBrandApple,
  IconEye,
  IconEyeOff,
  IconLoader2,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth/client"
import { getSafeRedirectPath } from "@/lib/utils"

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Validated before use — this is a query param, so it's attacker-
  // controllable (e.g. a crafted `?callbackURL=https://evil.com` link).
  // Falls back to /dashboard exactly like a direct /login visit always did.
  const callbackURL = getSafeRedirectPath(searchParams.get("callbackURL")) ?? "/dashboard"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "loading" | "apple">("idle")

  const justVerified = searchParams.get("verified") === "1"

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!emailPattern.test(email)) {
      setError("Enter a valid email address.")
      return
    }

    if (!password) {
      setError("Enter your password.")
      return
    }

    setStatus("loading")

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
      rememberMe,
    })

    setStatus("idle")

    if (signInError) {
      setError(
        signInError.message ?? "Couldn't sign in with those details. Try again."
      )
      return
    }

    router.push(callbackURL)
    // Server components (e.g. anything reading getSession()) won't know
    // the session exists until the router cache is invalidated.
    router.refresh()
  }

  async function onAppleSignIn() {
    setError(null)
    setStatus("apple")

    const { error: appleError } = await authClient.signIn.social({
      provider: "apple",
      callbackURL,
    })

    if (appleError) {
      setStatus("idle")
      setError(
        appleError.code === "PROVIDER_NOT_FOUND"
          ? "Sign in with Apple isn't available right now."
          : (appleError.message ?? "Sign in with Apple isn't available right now.")
      )
    }
  }

  return (
    <>
      <div className="space-y-2 text-center">
        <h1 className="text-xl font-medium">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your Aurora Organics account.
        </p>
      </div>

      {justVerified ? (
        <p
          className="mt-6 rounded-lg border border-primary/30 bg-primary/10 p-3 text-center text-sm text-primary"
          role="status"
        >
          Email verified — you can sign in now.
        </p>
      ) : null}

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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
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

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked === true)}
          />
          Remember me
        </label>

        {error ? (
          <p
            className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            role="alert"
          >
            <IconAlertCircle className="size-4" />
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={status !== "idle"}>
          {status === "loading" ? (
            <IconLoader2 className="size-4 animate-spin" />
          ) : null}
          Sign in
        </Button>
      </form>

      <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={status !== "idle"}
        onClick={onAppleSignIn}
      >
        {status === "apple" ? (
          <IconLoader2 className="size-4 animate-spin" />
        ) : (
          <IconBrandApple className="size-4" />
        )}
        Continue with Apple
      </Button>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-primary hover:underline"
        >
          Create one
        </Link>
      </p>
    </>
  )
}
