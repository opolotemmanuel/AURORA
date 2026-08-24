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

type SiteUrlOptions = {
  /**
   * Prefer the stable production alias (VERCEL_PROJECT_PRODUCTION_URL, then
   * VERCEL_URL) over this specific deployment's own unique URL. Needed for
   * links generated outside of a request — e.g. clinic invite emails — which
   * must still resolve after the preview deployment that sent them is torn
   * down. Both env vars are always present server-side on Vercel, unlike
   * their NEXT_PUBLIC_-prefixed mirrors used by the default precedence
   * below, which depend on a project setting.
   */
  preferStableAlias?: boolean
}

export function getSiteUrl(options: SiteUrlOptions = {}): string {
  const vercelHost = options.preferStableAlias
    ? process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
    : process.env.NEXT_PUBLIC_VERCEL_URL

  const fromEnv =
    process.env.BETTER_AUTH_URL || (vercelHost ? `https://${vercelHost}` : undefined)

  const normalized = fromEnv ? toOrigin(fromEnv) : null
  if (normalized) return normalized

  return `http://localhost:${process.env.PORT ?? 3000}`
}

/**
 * Every origin Vercel itself assigns to this project: the production alias,
 * the git-branch alias (only set when Git branch URLs are enabled), and this
 * specific deployment's own unique URL — plus the canonical getSiteUrl()
 * origin. Each of these host values is injected by the Vercel platform, not
 * supplied by the client, so a request whose Host header matches one of them
 * is presenting an origin this deployment actually owns, not an arbitrary
 * one. Used to allowlist which request-derived origins better-auth may
 * trust; see lib/auth/server.ts.
 */
export function getPlatformOrigins(): string[] {
  const hosts = [
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ].filter((value): value is string => Boolean(value))

  const origins = hosts
    .map((host) => toOrigin(`https://${host}`))
    .filter((value): value is string => value !== null)

  origins.push(getSiteUrl())

  return Array.from(new Set(origins))
}
