import assert from "node:assert/strict"
import { afterEach, describe, it } from "node:test"

import { isTenantRequest } from "@/lib/clinics/tenant-request"

const ROOT = "NEXT_PUBLIC_TENANT_ROOT_DOMAIN"

function withRoot(value: string | undefined) {
  if (value === undefined) delete process.env[ROOT]
  else process.env[ROOT] = value
}

afterEach(() => withRoot(undefined))

describe("isTenantRequest — no root domain (every *.vercel.app deployment)", () => {
  // The regression. The pin cookie is the only tenant mechanism available on a
  // host that cannot carry subdomains, and the proxy used to ignore it, so the
  // clinic front door redirected signed-in visitors to /dashboard.
  it("honours the pin cookie", () => {
    withRoot(undefined)
    assert.equal(
      isTenantRequest({ host: "aurora-5spm-zeta.vercel.app", pinnedTenant: "wellderm" }),
      true,
    )
  })

  it("is the platform when nothing is pinned", () => {
    withRoot(undefined)
    assert.equal(
      isTenantRequest({ host: "aurora-5spm-zeta.vercel.app", pinnedTenant: null }),
      false,
    )
    assert.equal(isTenantRequest({ host: "localhost:3000", pinnedTenant: undefined }), false)
  })

  // A preview URL must never be read as a clinic named after the branch.
  it("does not treat an unknown host as a tenant on its own", () => {
    withRoot(undefined)
    assert.equal(
      isTenantRequest({ host: "aura-git-some-branch-xyz.vercel.app", pinnedTenant: "" }),
      false,
    )
  })

  it("still resolves a real localhost subdomain, which is how local links work", () => {
    withRoot(undefined)
    assert.equal(isTenantRequest({ host: "wellderm.localhost:3000", pinnedTenant: null }), true)
  })
})

describe("isTenantRequest — root domain configured", () => {
  it("resolves a tenant subdomain", () => {
    withRoot("aurora.app")
    assert.equal(isTenantRequest({ host: "wellderm.aurora.app", pinnedTenant: null }), true)
  })

  it("treats the bare root domain as the platform", () => {
    withRoot("aurora.app")
    assert.equal(isTenantRequest({ host: "aurora.app", pinnedTenant: null }), false)
    assert.equal(isTenantRequest({ host: "AURORA.APP:443", pinnedTenant: null }), false)
  })

  // A reserved label is the platform's own, never a clinic.
  it("treats reserved subdomains as the platform", () => {
    withRoot("aurora.app")
    assert.equal(isTenantRequest({ host: "www.aurora.app", pinnedTenant: null }), false)
    assert.equal(isTenantRequest({ host: "admin.aurora.app", pinnedTenant: null }), false)
  })

  // Verified custom domains cannot be looked up from the edge, but with the
  // platform's own hosts known exactly, anything else is for resolveTenant to
  // identify rather than for the proxy to bounce to /dashboard.
  it("passes an off-platform host through as a possible custom domain", () => {
    withRoot("aurora.app")
    assert.equal(isTenantRequest({ host: "skin.theirclinic.com", pinnedTenant: null }), true)
  })

  // The cookie is a fallback for hosts that cannot carry a tenant. Once the
  // host can, it must not be a second way to select one.
  it("ignores the pin cookie entirely once host-based tenancy is available", () => {
    withRoot("aurora.app")
    assert.equal(isTenantRequest({ host: "aurora.app", pinnedTenant: "wellderm" }), false)
    assert.equal(isTenantRequest({ host: "www.aurora.app", pinnedTenant: "wellderm" }), false)
  })
})

describe("isTenantRequest — malformed input", () => {
  it("is the platform when there is no host at all", () => {
    withRoot(undefined)
    assert.equal(isTenantRequest({ host: null, pinnedTenant: null }), false)
    assert.equal(isTenantRequest({ host: "", pinnedTenant: null }), false)
  })
})
