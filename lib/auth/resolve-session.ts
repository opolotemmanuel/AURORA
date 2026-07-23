// Retry-aware session lookup, sitting under lib/auth/session.ts's plain
// getSession(). Exists so the two route-group layouts that gate a whole
// section behind a signed-in session ((dashboard) and (scan)) can tell a
// transient DB hiccup apart from someone genuinely not being signed in —
// today a DB error during the lookup itself either surfaces as a raw
// unhandled exception or (worse) gets treated the same as "no session" and
// bounces a signed-in user to /login. Runs on Node only (this whole module
// touches the DB via better-auth/Prisma) — proxy.ts's own session check
// stays Edge-safe and cookie-only, this is the real check beneath it, same
// boundary the codebase already draws.
import { cache } from "react"
import { headers } from "next/headers"

import { auth } from "@/lib/auth/auth"
import { hasAuthSessionCookie } from "@/lib/auth/session-cookie"

export type SessionResolveResult =
  | { status: "ok"; session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>> }
  | { status: "none" }
  | { status: "db_unavailable" }

const SESSION_LOOKUP_RETRIES = 2 // 3 attempts total
const RETRY_BASE_DELAY_MS = 300 // 300ms, 600ms

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// better-auth's own getSession handler wraps *every* internal failure
// (Prisma/pg errors, adapter timeouts, etc.) into a generic APIError whose
// message is always exactly "Failed to get session" — the underlying DB
// error is only logged server-side, never attached as `.cause` (verified
// against the installed better-auth's dist/api/routes/session.mjs). The
// same message is also thrown for a legitimate 401 — e.g. the session row
// was deleted concurrently (signed out on another tab) between the cookie
// check and the refresh write. The only reliable way to tell "DB is down"
// apart from "this session is genuinely gone" is the status code: 500 for
// the former, 401 for the latter. Only the 500 case is treated as
// retryable/transient.
function isTransientSessionLookupError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const err = error as { statusCode?: number; message?: string }
  return err.statusCode === 500 && err.message === "Failed to get session"
}

// Wrapped in React's cache() so multiple calls within the same request
// (e.g. a route-group layout's own check plus a page component further
// down that also calls getSession()) share one lookup — and, critically,
// one retry sequence — instead of each independently retrying against a
// down DB and stacking their latencies on top of each other.
export const resolveSession = cache(async (): Promise<SessionResolveResult> => {
  const requestHeaders = await headers()
  const hadSessionCookie = hasAuthSessionCookie(requestHeaders)

  let lastError: unknown

  for (let attempt = 0; attempt <= SESSION_LOOKUP_RETRIES; attempt++) {
    try {
      const session = await auth.api.getSession({ headers: requestHeaders })
      return session ? { status: "ok", session } : { status: "none" }
    } catch (error) {
      lastError = error

      if (!isTransientSessionLookupError(error) || attempt === SESSION_LOOKUP_RETRIES) {
        break
      }

      await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt)
    }
  }

  if (isTransientSessionLookupError(lastError)) {
    if (hadSessionCookie) {
      console.warn("[auth] session lookup failed after retries; treating as db_unavailable")
      return { status: "db_unavailable" }
    }
    // No session cookie was ever presented — nothing to protect by
    // stalling on a "reconnecting" screen, so this is just logged out.
    return { status: "none" }
  }

  // Not a session-lookup-shaped error at all — an unrelated bug. Let it
  // surface as before rather than silently mapping it to "logged out".
  throw lastError
})
