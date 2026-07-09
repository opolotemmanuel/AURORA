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

// Read downstream by app/(dashboard)/layout.tsx and app/(scan)/layout.tsx's
// own real getSession() check (defense-in-depth beneath this cheap cookie
// check) — Server Components have no built-in way to read the current
// request's path, so it's forwarded via this header, per Next's documented
// proxy/middleware request-header pattern. Always the server's own computed
// pathname (see below), never a value taken from the client, so nothing
// downstream needs to treat it as untrusted input.
export const CURRENT_PATH_HEADER = "x-aura-pathname"

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
    loginUrl.searchParams.set("callbackURL", pathname + request.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  if (hasSession && AUTH_ONLY_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(CURRENT_PATH_HEADER, pathname + request.nextUrl.search)
  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  // Excludes better-auth's own routes (/api/auth/*), static assets, and
  // Next internals — everything else runs through the checks above.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
