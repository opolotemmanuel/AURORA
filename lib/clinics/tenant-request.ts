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
  if (extractSubdomain(host)) return true

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

  // Last, and only where the host can carry no tenant at all, so a cookie can
  // never override real host-based routing.
  if (hostBasedTenancyConfigured()) return false
  return Boolean(pinnedTenant)
}
