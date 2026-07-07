"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { IconAlertCircle, IconCheck, IconLoader2 } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"

type AuthMode = "login" | "register"

type FormState = {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  rememberMe: boolean
}

const initialState: FormState = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  rememberMe: false,
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const placeholderSessionKey = "aurora-placeholder-session"

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(initialState)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const isRegister = mode === "register"
  const title = isRegister ? "Create account" : "Sign in"
  const description = isRegister
    ? "Create your Aurora SkinSense account placeholder."
    : "Sign in to continue to your dashboard."

  const submitLabel = useMemo(() => {
    if (status === "loading") {
      return isRegister ? "Creating account" : "Signing in"
    }

    return isRegister ? "Create Account" : "Login"
  }, [isRegister, status])

  function updateField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
    setStatus("idle")
    setMessage("")
  }

  function validate() {
    const nextErrors: Partial<Record<keyof FormState, string>> = {}

    if (isRegister && !form.fullName.trim()) {
      nextErrors.fullName = "Enter your full name."
    }

    if (!form.email.trim()) {
      nextErrors.email = "Enter your email address."
    } else if (!emailPattern.test(form.email)) {
      nextErrors.email = "Enter a valid email address."
    }

    if (!form.password) {
      nextErrors.password = "Enter your password."
    } else if (form.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters."
    }

    if (isRegister && form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = "Passwords must match."
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!validate()) {
      setStatus("error")
      setMessage("Please fix the highlighted fields.")
      return
    }

    setStatus("loading")
    setMessage("")

    await new Promise((resolve) => setTimeout(resolve, 500))

    window.localStorage.setItem(
      placeholderSessionKey,
      JSON.stringify({
        email: form.email,
        fullName: form.fullName || form.email.split("@")[0],
        rememberMe: form.rememberMe,
        createdAt: new Date().toISOString(),
      })
    )
    window.dispatchEvent(new Event("aurora-auth-change"))

    setStatus("success")
    setMessage(isRegister ? "Account created. Redirecting..." : "Signed in. Redirecting...")
    router.push("/dashboard")
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="space-y-2 text-center">
        <h1 className="text-xl font-medium">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
        {isRegister ? (
          <Field
            id="fullName"
            label="Full Name"
            value={form.fullName}
            error={errors.fullName}
            autoComplete="name"
            onChange={(value) => updateField("fullName", value)}
          />
        ) : null}

        <Field
          id="email"
          label="Email Address"
          type="email"
          value={form.email}
          error={errors.email}
          autoComplete="email"
          onChange={(value) => updateField("email", value)}
        />

        <Field
          id="password"
          label="Password"
          type="password"
          value={form.password}
          error={errors.password}
          autoComplete={isRegister ? "new-password" : "current-password"}
          onChange={(value) => updateField("password", value)}
        />

        {isRegister ? (
          <Field
            id="confirmPassword"
            label="Confirm Password"
            type="password"
            value={form.confirmPassword}
            error={errors.confirmPassword}
            autoComplete="new-password"
            onChange={(value) => updateField("confirmPassword", value)}
          />
        ) : null}

        {!isRegister ? (
          <div className="flex items-center justify-between gap-4 text-sm">
            <label className="flex items-center gap-2 text-muted-foreground">
              <input
                type="checkbox"
                checked={form.rememberMe}
                onChange={(event) => updateField("rememberMe", event.target.checked)}
                className="size-4 rounded border-border accent-primary"
              />
              Remember Me
            </label>
            <Link href="/login" className="font-medium text-primary hover:underline">
              Forgot Password?
            </Link>
          </div>
        ) : null}

        {message ? (
          <p
            className="flex items-center gap-2 rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground"
            role="status"
          >
            {status === "success" ? (
              <IconCheck className="size-4 text-primary" />
            ) : (
              <IconAlertCircle className="size-4 text-destructive" />
            )}
            {message}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={status === "loading"}>
          {status === "loading" ? <IconLoader2 className="size-4 animate-spin" /> : null}
          {submitLabel}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        {isRegister ? "Already have an account?" : "New to Aurora SkinSense?"}{" "}
        <Link
          href={isRegister ? "/login" : "/register"}
          className="font-medium text-primary hover:underline"
        >
          {isRegister ? "Login" : "Create Account"}
        </Link>
      </p>
    </div>
  )
}

function Field({
  id,
  label,
  value,
  error,
  onChange,
  type = "text",
  autoComplete,
}: {
  id: string
  label: string
  value: string
  error?: string
  onChange: (value: string) => void
  type?: string
  autoComplete?: string
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20"
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
