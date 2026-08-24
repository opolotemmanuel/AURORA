import { extractSubdomain, platformRootDomain } from "@/lib/clinics/subdomain"
import { hostBasedTenancyConfigured } from "@/lib/clinics/tenant-cookie"

/**
 * Whether a request is for a clinic rather than for Aurora itself.
 *
 * Mirrors the precedence in lib/clinics/tenant.ts — host first, pin cookie only
 * when the host cannot carry a tenant — so the proxy and tenant resolution can
 * never disagree about whose site this is.
 *
 * They did disagree. resolveTenant honoured the pin cookie and proxy.ts did
 * not, so on any deployment without a wildcard domain — which is every
 * *.vercel.app — a signed-in visitor following a clinic link was pinned to that
 * clinic and then immediately redirected to /dashboard. The clinic's front door
 * was unreachable in production while working locally, because local links use
 * real *.localhost subdomains and take the host path instead.
 *
 * Deliberately free of any database access: the caller is edge middleware.
 * Which clinic it is, and whether that clinic is active, stay in resolveTenant.
 */
export function isTenantRequest({
  host,
  pinnedTenant,
}: {
  host: string | null | undefined
  /** Value of the tenant pin cookie, if the browser sent one. */
  pinnedTenant: string | null | undefined
}): boolean {
  if (selectedTenantSubdomain({ host, pinnedTenant })) return true

  // Verified custom domains are rows in the database, which is unreachable from
  // the edge. But when a root domain is configured the platform's own hosts are
  // known exactly, so a host that is neither the root nor a subdomain of it is
  // a custom domain or nothing — and resolveTenant, which can check, decides
  // which. Skipped when no root domain is set, where that inference would be
  // unfounded and the pin cookie is the mechanism anyway.
  const root = platformRootDomain()
  if (root && host) {
    const normalized = host.trim().toLowerCase().split(":")[0]
    if (normalized && normalized !== root && !normalized.endsWith(`.${root}`)) {
      return true
    }
  }

  return false
}

/**
 * The clinic subdomain identifying this request, or null for the platform.
 *
 * The single expression of "host first, pin cookie only where the host can
 * carry no tenant". Anywhere that needs to know *which* clinic — as opposed to
 * merely whether there is one — should resolve it through here, so a new caller
 * cannot quietly reintroduce a host-only check.
 *
 * Says nothing about custom domains: those are rows in the database and cannot
 * be recognised from a string. A caller that can query resolves them itself,
 * after this returns null.
 */
export function selectedTenantSubdomain({
  host,
  pinnedTenant,
}: {
  host: string | null | undefined
  pinnedTenant: string | null | undefined
}): string | null {
  const fromHost = extractSubdomain(host)
  if (fromHost) return fromHost

  // Only where the host can carry no tenant at all, so a cookie can never
  // override real host-based routing.
  if (hostBasedTenancyConfigured()) return null

  const pinned = pinnedTenant?.trim().toLowerCase()
  return pinned || null
}

/**
 * One cookie value out of a raw Cookie header.
 *
 * The auth hook is handed the request's headers rather than running inside
 * Next's request helpers, so there is no cookies() to call there.
 */
export function readCookie(
  cookieHeader: string | null | undefined,
  name: string,
): string | null {
  if (!cookieHeader) return null

  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=")
    if (eq === -1) continue
    if (part.slice(0, eq).trim() !== name) continue
    return decodeURIComponent(part.slice(eq + 1).trim()) || null
  }

  return null
}
