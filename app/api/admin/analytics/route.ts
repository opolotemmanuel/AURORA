// JSON API counterpart to the server-rendered admin dashboard
// (app/(dashboard)/admin/page.tsx) — same data, same access check, but as a
// fetchable endpoint (e.g. for polling or an external integration) rather
// than a page render. Uses assertAdminAccess (returns a result) instead of
// requireAdminAccess (throws) since a route handler needs to shape its own
// JSON error response rather than let an exception propagate.
import { NextResponse } from "next/server"

import { getAdminAnalytics } from "@/lib/backend/admin-analytics"
import { saveAuditLog } from "@/lib/backend/report-store"
import { assertAdminAccess } from "@/lib/auth/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const auth = await assertAdminAccess("analytics:read")

  if (!auth.allowed) {
    return NextResponse.json({ success: false, error: "Admin access required." }, { status: 403 })
  }

  await saveAuditLog({
    actorId: auth.principal.id,
    actorRole: auth.principal.role,
    action: "Viewed admin analytics",
    targetType: "admin",
    targetId: "analytics",
  })

  return NextResponse.json({
    success: true,
    analytics: await getAdminAnalytics(),
    auth,
  })
}
