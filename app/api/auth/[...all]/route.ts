// Catch-all that mounts every better-auth endpoint (sign-in, sign-out,
// email-otp send/verify, session, etc.) under /api/auth/* — this file has
// no logic of its own; all auth behavior is configured in lib/auth/auth.ts.
import { toNextJsHandler } from "better-auth/next-js"

import { auth } from "@/lib/auth/auth"

export const { GET, POST } = toNextJsHandler(auth)
