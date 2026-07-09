// Edge-safe route gate. Only checks "is there a plausible session cookie at
// all" via getSessionCookie (no DB hit, no signature/expiry validation) —
// role-based (admin-tier) enforcement can't happen here since the role
// isn't in the raw cookie, so that stays server-side in
// app/(dashboard)/admin/layout.tsx, which does a real getSession() call.
import { NextResponse, type NextRequest } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/scan",
  "/reports",
  "/admin",
  "/settings",
  "/profile",
]
const AUTH_ONLY_PATHS = ["/login", "/register"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasSession = Boolean(getSessionCookie(request))

  if (
    !hasSession &&
    PROTECTED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  ) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (hasSession && AUTH_ONLY_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Excludes better-auth's own routes (/api/auth/*), static assets, and
  // Next internals — everything else runs through the checks above.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
