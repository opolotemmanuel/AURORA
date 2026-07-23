// Thin server-only helper so server components/route handlers don't each
// have to remember to forward the incoming request headers (which is how
// better-auth reads the session cookie) into `auth.api.getSession`.
//
// Delegates to resolve-session.ts, which retries a couple of times on a
// transient DB error before giving up — so a brief DB hiccup now quietly
// self-heals here instead of throwing. Every existing caller of
// getSession() keeps its original `session | null` contract unchanged; the
// only thing that changes for them is that a transient blip which used to
// surface as a raw thrown error now more often just resolves normally.
//
// Callers that specifically need to tell "DB unavailable" apart from
// "genuinely no session" (so they can show a fallback instead of
// redirecting to /login) should call resolveSession() directly instead —
// see app/(dashboard)/layout.tsx and app/(scan)/layout.tsx.
import { resolveSession } from "@/lib/auth/resolve-session"

export async function getSession() {
  const result = await resolveSession()
  return result.status === "ok" ? result.session : null
}
