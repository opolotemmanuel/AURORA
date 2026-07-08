import { NextResponse } from "next/server"

import { requireApiSession } from "@/lib/auth/api-session"
import { toUserFacingScanError } from "@/lib/scan/errors"
import { runLiveAnalyzeScan } from "@/lib/scan/run-live-analyze"

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"])

export async function POST(request: Request) {
  const authResult = await requireApiSession()
  if ("response" in authResult) {
    return authResult.response
  }
  const { session } = authResult

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid live scan upload." },
      { status: 400 },
    )
  }

  const image = formData.get("image")
  if (!(image instanceof Blob) || image.size === 0) {
    return NextResponse.json(
      { ok: false, error: toUserFacingScanError(new Error("Invalid scan image")) },
      { status: 400 },
    )
  }

  const transcriptField = formData.get("transcript")
  const transcript =
    typeof transcriptField === "string" ? transcriptField.trim() : ""

  const durationField = formData.get("sessionDurationMs")
  const sessionDurationMs =
    typeof durationField === "string"
      ? Number.parseInt(durationField, 10) || 0
      : 0

  const mimeField = formData.get("mimeType")
  const mimeType =
    typeof mimeField === "string" && ALLOWED_MIME.has(mimeField)
      ? (mimeField as "image/jpeg" | "image/png" | "image/webp")
      : image.type && ALLOWED_MIME.has(image.type)
        ? (image.type as "image/jpeg" | "image/png" | "image/webp")
        : "image/jpeg"

  const buffer = Buffer.from(await image.arrayBuffer())
  const result = await runLiveAnalyzeScan({
    userId: session.user.id,
    image: buffer,
    mimeType,
    transcript,
    sessionDurationMs,
  })

  const status = result.ok
    ? 200
    : !result.ok && result.error.toLowerCase().includes("pro")
      ? 403
      : 400
  return NextResponse.json(result, { status })
}
