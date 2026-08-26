import { revalidateTag } from "next/cache"

export const CATALOG_CONTEXT_TAG = "catalog-context"

const USER_SCAN_CONTEXT_PREFIX = "user-scan-context"
const SCAN_HISTORY_CONTEXT_PREFIX = "scan-history-context"

/** Safety TTL when tag revalidation is missed (seconds). */
export const CATALOG_CACHE_REVALIDATE_SECONDS = 3600
export const USER_SCAN_CONTEXT_REVALIDATE_SECONDS = 300
export const SCAN_HISTORY_CACHE_REVALIDATE_SECONDS = 300

export function userScanContextTag(userId: string): string {
  return `${USER_SCAN_CONTEXT_PREFIX}:${userId}`
}

export function scanHistoryContextTag(userId: string): string {
  return `${SCAN_HISTORY_CONTEXT_PREFIX}:${userId}`
}

/**
 * The cache key for one clinic's slice of the catalogue.
 *
 * The global catalogue is cached under one tag because every tenant sees the
 * same rows. A clinic's own products are not the same for everyone, so they get
 * a tag of their own — without this, the first tenant to warm the cache would
 * serve its private catalogue to every other tenant, silently and until the TTL
 * expired.
 */
export function tenantCatalogContextTag(organizationId: string): string {
  return `${CATALOG_CONTEXT_TAG}:${organizationId}`
}

/** Invalidates the Aurora catalogue. Does not touch any clinic's own. */
export function revalidateCatalogContext(): void {
  revalidateTag(CATALOG_CONTEXT_TAG, "max")
}

/** Invalidates one clinic's catalogue. Does not touch Aurora's or anyone else's. */
export function revalidateTenantCatalogContext(organizationId: string): void {
  revalidateTag(tenantCatalogContextTag(organizationId), "max")
}

export function revalidateUserScanContext(userId: string): void {
  revalidateTag(userScanContextTag(userId), "max")
}

export function revalidateScanHistoryContext(userId: string): void {
  revalidateTag(scanHistoryContextTag(userId), "max")
}

export function revalidateAiUserContext(userId: string): void {
  revalidateUserScanContext(userId)
  revalidateScanHistoryContext(userId)
}
