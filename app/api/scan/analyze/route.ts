import { NextResponse } from "next/server"

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

    const analysis = buildFallbackSkinAnalysis()

    return NextResponse.json({
      success: false,
      fallback: true,
      error:
        "Live Gemini analysis is not bundled in this branch, so a cosmetic fallback report was returned.",
      image: {
        fileName: image.name,
        mimeType: normalizedType,
        size: image.size,
        stored: false,
      },
      analysis,
    })
  } catch (error) {
    const fallback = buildFallbackSkinAnalysis()

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
        analysis: fallback,
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

function buildFallbackSkinAnalysis() {
  return {
    summary:
      "We could not complete a live AI review in this build, so this fallback report keeps guidance general and cosmetic-only.",
    cosmeticFindings: [
      {
        label: "Image quality",
        band: "not_visible",
        observation: "A live cosmetic reading was not available for this image.",
      },
      {
        label: "Visible texture",
        band: "not_visible",
        observation: "Please retry once live analysis is enabled for more specific cosmetic guidance.",
      },
    ],
    recommendations: [
      {
        title: "Gentle daily routine",
        reason: "Cleanse, moisturize, and use daytime sun protection as general wellness care.",
      },
      {
        title: "Retry later",
        reason: "Live analysis can provide more specific Aurora recommendations when enabled.",
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
