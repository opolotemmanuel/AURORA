// Cheap "is there a session cookie at all" check with no DB round-trip —
// same shape of check as proxy.ts's own getSessionCookie() gate, but usable
// from resolve-session.ts to decide whether a failed DB-backed session
// lookup represents "someone claiming to be signed in" (worth retrying /
// showing the reconnecting screen for) versus a request with no session
// cookie in the first place (nothing to protect, so just treat as logged
// out even if the lookup itself errored).
export function hasAuthSessionCookie(headers: Headers): boolean {
  const cookie = headers.get("cookie") ?? ""
  return /(?:^|;\s*)(?:__Secure-)?better-auth\.session_token=/.test(cookie)
}
