import { NextResponse } from "next/server"

import { getAdminAnalytics } from "@/lib/backend/admin-analytics"
import { saveAuditLog } from "@/lib/backend/report-store"
import { assertAdminAccess } from "@/lib/auth/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const auth = assertAdminAccess("analytics:read")

  if (!auth.allowed) {
    return NextResponse.json({ success: false, error: "Admin access required." }, { status: 401 })
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
