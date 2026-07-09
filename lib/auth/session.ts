// Thin server-only helper so server components/route handlers don't each
// have to remember to forward the incoming request headers (which is how
// better-auth reads the session cookie) into `auth.api.getSession`.
import { headers } from "next/headers"

import { auth } from "@/lib/auth/auth"

export async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}
