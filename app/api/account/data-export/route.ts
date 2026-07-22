// Real "download your data" export — the signed-in user's own reports and
// findings as JSON. Same authenticated-download shape as
// app/api/reports/[reportId]/download/route.ts (session check, audit log,
// Content-Disposition: attachment), scoped to the caller's own userId only
// — there is no reportId/userId param to spoof here, session.user.id is
// the only source of identity.
import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth/session"
import { buildUserDataExport } from "@/lib/backend/account-data"
import { saveAuditLog } from "@/lib/backend/report-store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 })
  }

  const data = await buildUserDataExport(session.user.id, session.user.email)

  await saveAuditLog({
    actorId: session.user.id,
    action: "Downloaded personal data export",
    targetType: "download",
    targetId: session.user.id,
  })

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Disposition": `attachment; filename="aura-data-export-${session.user.id}.json"`,
      "Content-Type": "application/json",
    },
  })
}
