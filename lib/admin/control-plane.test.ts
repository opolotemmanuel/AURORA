import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

import { getNavSections, type AppRole } from "@/lib/dashboard/nav"

/**
 * Admin control plane guarantees.
 *
 * Asserted against source where the guarantee is structural — that a mutation
 * writes a status rather than deleting a row, that a loader authorizes itself,
 * that a query filters by tenant inside the where clause. None of those can be
 * demonstrated by calling a function with test data; they are properties of the
 * shape of the code.
 */

const memberActions = readFileSync("lib/clinics/member-actions.ts", "utf8")
const queries = readFileSync("lib/clinics/queries.ts", "utf8")
const auditQueries = readFileSync("lib/admin/audit-queries.ts", "utf8")
const auditLoader = readFileSync("components/admin/audit-log-loader.tsx", "utf8")

describe("membership is a lifecycle, not a row that disappears", () => {
  // Phase 2 added Member.status so revocation would keep the record of the
  // relationship. Nothing wrote it: removal still deleted the row.
  it("no membership mutation deletes a row", () => {
    assert.doesNotMatch(memberActions, /member\.delete\(/)
  })

  it("revoking sets the status instead", () => {
    const fn = memberActions.match(
      /export async function removeClinicMemberAction[\s\S]*?\n\}/,
    )
    assert.ok(fn, "expected the revoke action")
    assert.match(fn[0], /data: \{ status: "revoked" \}/)
    assert.match(fn[0], /action: "membership\.revoked"/)
  })

  it("suspension is reversible and revocation is not", () => {
    const fn = memberActions.match(
      /export async function setClinicMemberStatusAction[\s\S]*?\n\}/,
    )
    assert.ok(fn, "expected the status action")
    // The schema offers only the two reversible states.
    assert.match(memberActions, /status: z\.enum\(\["active", "suspended"\]\)/)
    assert.match(fn[0], /member\.status === "revoked"/)
  })

  it("the owner cannot be revoked or suspended", () => {
    const revoke = memberActions.match(/export async function removeClinicMemberAction[\s\S]*?\n\}/)
    const status = memberActions.match(/export async function setClinicMemberStatusAction[\s\S]*?\n\}/)
    for (const fn of [revoke, status]) {
      assert.ok(fn)
      assert.match(fn[0], /role === "owner"/)
    }
  })

  it("every membership mutation is audited", () => {
    for (const action of [
      "membership.revoked",
      "membership.role_changed",
      "membership.suspended",
      "membership.reactivated",
    ]) {
      assert.match(memberActions, new RegExp(action.replace(".", "\\.")))
    }
  })

  // A revoked member is not staff. Leaving them in the list would show them as
  // colleagues and, worse, hold a seat against the plan.
  it("revoked members leave the team list and free their seat", () => {
    assert.match(queries, /status: \{ not: "revoked" \}/)
    assert.match(memberActions, /status: \{ in: \["active", "invited"\] \}/)
  })
})

describe("membership mutations stay inside one tenant", () => {
  // The member is found by id *and* scope together, so an id from another
  // clinic simply does not match — nothing is read and then checked.
  it("every lookup carries the tenant scope in the where clause", () => {
    const lookups = [...memberActions.matchAll(/member\.findFirst\(\{[\s\S]*?\}\)/g)]
    assert.ok(lookups.length >= 3, "expected the membership lookups")
    for (const l of lookups) {
      assert.match(l[0], /organizationId: session\.scope/)
    }
  })

  it("no membership action accepts an organizationId argument", () => {
    for (const m of memberActions.matchAll(/z\.object\(\{[\s\S]*?\}\)/g)) {
      assert.doesNotMatch(m[0], /organizationId/)
    }
  })
})

describe("audit viewer", () => {
  it("authorizes itself rather than trusting the layout", () => {
    assert.match(auditLoader, /await requireAdmin\(\)/)
  })

  it("is cursor paginated rather than loading the whole table", () => {
    assert.match(auditQueries, /AUDIT_PAGE_SIZE/)
    assert.match(auditQueries, /cursor: \{ id: filter\.cursor \}/)
  })

  // Actors and tenants are resolved in one query each, not per row.
  it("resolves actors and tenants without N+1", () => {
    assert.match(auditQueries, /id: \{ in: actorIds \}/)
    assert.match(auditQueries, /organizationId: \{ in: orgIds \}/)
  })

  // The entry must outlive the tenant, or deleting a clinic erases the record
  // of it having been deleted.
  it("survives the deletion of its tenant", () => {
    assert.match(auditQueries, /deleted: !org/)
    assert.match(auditQueries, /meta\.subdomain/)
  })
})

describe("admin navigation", () => {
  it("offers Clinics and the audit log to administrators", () => {
    const hrefs = getNavSections("admin" as AppRole)
      .flatMap((s) => s.items)
      .map((i) => i.href)
    assert.ok(hrefs.includes("/admin/clinics"), "Clinics must stay in the admin sidebar")
    assert.ok(hrefs.includes("/admin/audit"))
  })

  for (const role of ["user", "expert", "affiliate"] as AppRole[]) {
    it(`does not offer them to a ${role}`, () => {
      const hrefs = getNavSections(role)
        .flatMap((s) => s.items)
        .map((i) => i.href)
      assert.ok(!hrefs.some((h) => h.startsWith("/admin")))
    })
  }
})

describe("tenant deletion stays accountable", () => {
  const offboard = readFileSync("lib/admin/clinic-offboard-actions.ts", "utf8")

  it("records enough to identify the tenant after its rows are gone", () => {
    const entry = offboard.match(/action: "tenant\.deleted"[\s\S]*?\n  \}\)/)
    assert.ok(entry, "expected the deletion audit entry")
    for (const field of ["subdomain", "displayName", "detachedScans"]) {
      assert.match(entry[0], new RegExp(field))
    }
  })

  it("writes the entry before the delete", () => {
    assert.ok(
      offboard.indexOf('action: "tenant.deleted"') <
        offboard.indexOf("organization.delete"),
    )
  })
})
