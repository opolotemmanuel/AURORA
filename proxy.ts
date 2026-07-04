import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

/**
 * Next.js 16+: use `proxy.ts` (not `middleware.ts`).
 * Keep this thin — cookie presence only. Session, onboarding, and role
 * checks live in route layouts via lib/auth/session.ts.
 *
 * @see node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const sessionCookie = getSessionCookie(request)
  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/onboarding",
    "/onboarding/:path*",
    "/scan",
    "/scan/:path*",
  ],
}
