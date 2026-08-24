/**
 * Single source of truth for the app's own origin (scheme + host[:port], no
 * path, no trailing slash).
 *
 * Vercel serves this deployment from several aliases at once — a production
 * alias, a git-branch alias, a per-deployment preview alias, and potentially
 * a custom domain — but only one value can ever be pinned in BETTER_AUTH_URL.
 * Everything that needs "our own origin" must resolve it through here so
 * there is exactly one place that pins it.
 */

function toOrigin(raw: string): string | null {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    try {
      url = new URL(`https://${raw}`)
    } catch {
      return null
    }
  }

  if (url.hostname !== "localhost") {
    url.protocol = "https:"
  }

  return url.origin
}

export function getSiteUrl(): string {
  const fromEnv =
    process.env.BETTER_AUTH_URL ||
    (process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : undefined)

  const normalized = fromEnv ? toOrigin(fromEnv) : null
  if (normalized) return normalized

  return `http://localhost:${process.env.PORT ?? 3000}`
}
