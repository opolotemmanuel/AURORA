// The scan upload endpoint: validates the image, calls Gemini (falling back
// to a rule-based report if that fails), then persists everything via
// scan-service. Two layers of fallback exist so the user always gets a
// report: analyzeImageWithFallback covers a Gemini-specific failure, and the
// outer try/catch in POST covers anything else going wrong (bad form data,
// createScanReport itself throwing, etc).
import { NextResponse } from "next/server"

import {
  analyzeSkinWithGemini,
  getGeminiDiagnosticMessage,
  getGeminiFallbackUserMessage,
} from "@/lib/ai/gemini-adapter"
import { getSession } from "@/lib/auth/session"
import { readImageDimensions } from "@/lib/backend/image-dimensions"
import { createScanReport } from "@/lib/backend/scan-service"
import type { ScanAnalysisReport, ScanSource } from "@/lib/backend/types"
import { getClimateSnapshot, type ClimateSnapshot } from "@/lib/climate/adapter"

const MAX_IMAGE_SIZE = 8 * 1024 * 1024
const DISCLAIMER =
  "Aurora SkinSense provides cosmetic wellness guidance only. This is not a medical diagnosis, treatment plan, or substitute for professional medical advice."
const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", ["jpg", "jpeg"]],
  ["image/jpg", ["jpg"]],
  ["image/png", ["png"]],
  ["image/webp", ["webp"]],
])

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  // Attributes the scan to the signed-in user if there is one — anonymous
  // (logged-out) scans are still allowed, they just never get a dashboard
  // history entry or a report chat button (both require a real owner).
  const session = await getSession()

  try {
    const formData = await request.formData()
    const images = formData.getAll("image")

    if (images.length !== 1 || !(images[0] instanceof File)) {
      return jsonError("Upload exactly one image using the image field.", 400)
    }

    const image = images[0]
    const normalizedType = normalizeMimeType(image.type)

    if (!normalizedType || !hasAllowedExtension(image.name, normalizedType)) {
      return jsonError("Only jpg, jpeg, png, and webp images are supported.", 400)
    }

    if (image.size > MAX_IMAGE_SIZE) {
      return jsonError("Image must be 8MB or smaller.", 400)
    }

    if (image.size === 0) {
      return jsonError("Image upload is empty.", 400)
    }

    // Climate is entirely optional and independent of the Gemini call above
    // — it never touches the AI adapter or its quota. `lat`/`lon` only ever
    // exist for the duration of this request (see getScanClimate below);
    // they're never written to the database, and neither is the resulting
    // snapshot — it only shapes this one call's recommendation scoring.
    const climate = await getScanClimate(formData)

    const geminiResult = await analyzeImageWithFallback(image)
    const dimensions = readImageDimensions(
      Buffer.from(await image.arrayBuffer()),
      normalizedType,
    )
    // `stored: false` always — per AGENTS.md's privacy rule, the photo
    // itself is never persisted, only its metadata and the resulting report.
    const bundle = await createScanReport({
      image: {
        fileName: image.name,
        mimeType: normalizedType,
        size: image.size,
        width: dimensions?.width,
        height: dimensions?.height,
        stored: false,
      },
      analysis: geminiResult.analysis,
      source: normalizeScanSource(formData.get("source")),
      fallbackReason: geminiResult.fallbackReason,
      aiProviderReason: geminiResult.aiProviderReason,
      userAgent: request.headers.get("user-agent") ?? undefined,
      aiDurationMs: geminiResult.durationMs,
      userId: session?.user.id,
      climate,
    })

    return NextResponse.json({
      success: !geminiResult.fallback,
      fallback: geminiResult.fallback,
      error: geminiResult.fallbackReason,
      image: {
        fileName: image.name,
        mimeType: normalizedType,
        size: image.size,
        stored: false,
      },
      analysis: bundle.report.analysis,
      scan: bundle.scan,
      report: {
        id: bundle.report.id,
        scanId: bundle.report.scanId,
        createdAt: bundle.report.createdAt,
      },
      recommendations: bundle.report.recommendations,
      reportDownloadUrl: `/api/reports/${bundle.report.id}/print`,
      // Only present when climate data actually informed this scan's
      // recommendations — the client shows an indicator when this is set,
      // and shows nothing when it's null, per the "coarse, honest output
      // only" rule (never imply climate was used when it wasn't).
      climate,
    })
  } catch (error) {
    const fallback = buildFallbackSkinAnalysis()
    const bundle = await createScanReport({
      image: {
        stored: false,
      },
      analysis: fallback,
      source: "unknown",
      fallbackReason:
        error instanceof Error
          ? "Scan analysis failed, so a cosmetic fallback report was returned."
          : "Scan analysis was unavailable, so a cosmetic fallback report was returned.",
      userAgent: request.headers.get("user-agent") ?? undefined,
      userId: session?.user.id,
    })

    return NextResponse.json(
      {
        success: false,
        fallback: true,
        error:
          error instanceof Error
            ? "Scan analysis failed, so a cosmetic fallback report was returned."
            : "Scan analysis was unavailable, so a cosmetic fallback report was returned.",
        image: {
          stored: false,
        },
        analysis: bundle.report.analysis,
        scan: bundle.scan,
        report: {
          id: bundle.report.id,
          scanId: bundle.report.scanId,
          createdAt: bundle.report.createdAt,
        },
        recommendations: bundle.report.recommendations,
        reportDownloadUrl: `/api/reports/${bundle.report.id}/print`,
      },
      { status: 200 },
    )
  }
}

function normalizeMimeType(mimeType: string) {
  if (mimeType === "image/jpg") return "image/jpeg"
  return ALLOWED_IMAGE_TYPES.has(mimeType) ? mimeType : null
}

function hasAllowedExtension(fileName: string, mimeType: string) {
  const extension = fileName.split(".").pop()?.toLowerCase()
  const allowedExtensions = ALLOWED_IMAGE_TYPES.get(mimeType)

  if (!extension || !allowedExtensions) return false
  return allowedExtensions.includes(extension)
}

function jsonError(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      fallback: false,
      error: message,
      analysis: null,
    },
    { status },
  )
}

function normalizeScanSource(value: FormDataEntryValue | null): ScanSource {
  if (value === "camera" || value === "upload") return value
  return "unknown"
}

// `lat`/`lon` are only present when the user explicitly granted location
// access in the scan flow (see components/scan/ScanFlow.tsx's location
// consent button) — absent whenever they declined, the browser blocked it,
// or geolocation isn't supported. Missing or invalid coordinates just mean
// "no climate boost for this scan," never a request failure.
async function getScanClimate(
  formData: FormData,
): Promise<ClimateSnapshot | null> {
  const rawLat = formData.get("lat")
  const rawLon = formData.get("lon")

  if (typeof rawLat !== "string" || typeof rawLon !== "string") {
    return null
  }

  const lat = Number(rawLat)
  const lon = Number(rawLon)

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    return null
  }

  return getClimateSnapshot(lat, lon)
}

// Wraps the Gemini call so a provider failure (quota, timeout, invalid
// response, etc.) degrades to a rule-based report instead of failing the
// whole request — the user still gets a usable (if generic) cosmetic report.
async function analyzeImageWithFallback(image: File): Promise<{
  analysis: ScanAnalysisReport
  fallback: boolean
  fallbackReason?: string
  aiProviderReason?: string
  durationMs: number
}> {
  const startedAt = Date.now()
  try {
    return {
      analysis: await analyzeSkinWithGemini(image),
      fallback: false,
      durationMs: Date.now() - startedAt,
    }
  } catch (error) {
    return {
      analysis: buildFallbackSkinAnalysis(),
      fallback: true,
      fallbackReason: getGeminiFallbackUserMessage(error),
      aiProviderReason: getGeminiDiagnosticMessage(error),
      durationMs: Date.now() - startedAt,
    }
  }
}

// Generic, non-AI cosmetic report used whenever Gemini can't be reached —
// deliberately bland ("not_visible" bands, generic tips) rather than
// guessing, so it never implies a real analysis happened.
function buildFallbackSkinAnalysis(): ScanAnalysisReport {
  return {
    summary:
      "AI analysis is temporarily unavailable, so this fallback report keeps guidance general and cosmetic-only.",
    cosmeticFindings: [
      {
        label: "Image quality",
        band: "not_visible",
        observation: "A live cosmetic reading was not available for this image.",
      },
      {
        label: "Visible texture",
        band: "not_visible",
        observation: "Please retry later for more specific cosmetic guidance.",
      },
    ],
    recommendations: [
      {
        title: "Gentle daily routine",
        reason: "Cleanse, moisturize, and use daytime sun protection as general wellness care.",
      },
      {
        title: "Retry later",
        reason: "AI analysis can provide more specific Aurora recommendations when available.",
      },
    ],
    routineTips: [
      "Use soft, even lighting and keep your face centered.",
      "Avoid heavy shadows for future scans.",
      "Treat this as cosmetic wellness guidance only.",
    ],
    quality: {
      lighting: "not_visible",
      framing: "unclear",
      confidence: "low",
    },
    disclaimer: DISCLAIMER,
    source: "fallback",
    model: "fallback",
  }
}
