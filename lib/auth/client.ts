// Browser-side counterpart to lib/auth/auth.ts's server instance. Used from
// client components (e.g. the login/register forms) to call
// sign-in/sign-up/sign-out. Email+password and `signIn.social` are core
// client methods — no plugin needed.
import { createAuthClient } from "better-auth/react"

// No `baseURL` passed — better-auth's browser client defaults to the
// current page's origin, so requests always target whatever host actually
// served the page (no risk of drifting from a hardcoded value).
export const authClient = createAuthClient()
