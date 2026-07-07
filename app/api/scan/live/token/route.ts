import { NextResponse } from "next/server"

import { createLiveScanToken } from "@/lib/ai/providers/gemini-live"
import { getSession } from "@/lib/auth/session"
import { getLiveScanModel } from "@/lib/models/queries"
import { requireProScanTier, ScanAccessError } from "@/lib/scan/access"
import { toUserFacingScanError } from "@/lib/scan/errors"

export async function POST() {
  let session
  try {
    session = await getSession()
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: toUserFacingScanError(err),
      },
      { status: 503 },
    )
  }

  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Please sign in to run a live scan." },
      { status: 401 },
    )
  }

  try {
    await requireProScanTier(session.user.id)
  } catch (err) {
    const message =
      err instanceof ScanAccessError
        ? err.message
        : "Live scan is available on the Pro tier only."
    return NextResponse.json({ ok: false, error: message }, { status: 403 })
  }

  const liveModel = await getLiveScanModel()
  if (!liveModel) {
    return NextResponse.json(
      {
        ok: false,
        error: toUserFacingScanError(
          new Error("No live scan model configured for Pro tier"),
        ),
      },
      { status: 503 },
    )
  }

  try {
    const token = await createLiveScanToken(liveModel.modelId)
    return NextResponse.json({ ok: true, ...token })
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: toUserFacingScanError(err),
      },
      { status: 500 },
    )
  }
}
