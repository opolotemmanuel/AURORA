import type { ScanAnalysisReport } from "@/lib/backend/types"

const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash"
const GEMINI_TIMEOUT_MS = 20000
const DISCLAIMER =
  "Aurora SkinSense provides cosmetic wellness guidance only. This is not a medical diagnosis, treatment plan, or substitute for professional medical advice."
const ALLOWED_BANDS = ["low", "balanced", "mild", "moderate", "elevated", "not_visible"] as const

type GeminiBand = (typeof ALLOWED_BANDS)[number]
type GeminiFailureKind =
  | "configuration"
  | "quota"
  | "auth"
  | "rate_limit"
  | "timeout"
  | "network"
  | "invalid_response"
  | "unknown"

type GeminiSkinAnalysisJson = {
  summary: string
  cosmeticFindings: Array<{
    label: string
    band: GeminiBand
    observation: string
  }>
  routineTips: string[]
  quality: {
    lighting: GeminiBand
    framing: "clear" | "usable" | "unclear"
    confidence: "low" | "medium" | "high"
  }
}

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
      }>
    }
    finishReason?: string
  }>
  error?: {
    message?: string
  }
}

export class GeminiAnalysisError extends Error {
  constructor(
    readonly kind: GeminiFailureKind,
    message: string,
    readonly providerMessage?: string,
  ) {
    super(message)
    this.name = "GeminiAnalysisError"
  }
}

export async function analyzeSkinWithGemini(image: File): Promise<ScanAnalysisReport> {
  const apiKey = process.env.GEMINI_API_KEY
  const model = getGeminiModel()

  logGeminiDiagnostic("Request starting", {
    hasApiKey: Boolean(apiKey),
    model,
    imageMimeType: image.type || "image/jpeg",
    imageSizeBytes: image.size,
  })

  if (!apiKey) {
    throw new GeminiAnalysisError("configuration", "GEMINI_API_KEY is missing.")
  }

  const imageBase64 = Buffer.from(await image.arrayBuffer()).toString("base64")
  const abortController = new AbortController()
  const timeout = setTimeout(() => abortController.abort(), GEMINI_TIMEOUT_MS)

  let response: Response

  try {
    response = await fetch(`${getGeminiEndpoint(model)}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      signal: abortController.signal,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: buildCosmeticPrompt() },
              {
                inlineData: {
                  mimeType: image.type || "image/jpeg",
                  data: imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
          maxOutputTokens: 1200,
        },
      }),
    })
  } catch (error) {
    throw classifyGeminiTransportError(error, model)
  } finally {
    clearTimeout(timeout)
  }

  logGeminiDiagnostic("Response received", {
    httpStatus: response.status,
    statusText: response.statusText,
  })

  const payload = await readGeminiPayload(response, model)

  if (!response.ok) {
    logGeminiDiagnostic("Request failed", {
      geminiError: payload.error ?? null,
    })

    throw classifyGeminiResponseError(response, payload, model)
  }

  const rawText = payload.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text
  if (!rawText) {
    throw new GeminiAnalysisError(
      "invalid_response",
      `Gemini returned no cosmetic analysis text for model ${model}.`,
    )
  }

  const parsedAnalysis = parseGeminiJson(rawText, model)
  logGeminiDiagnostic("Gemini response received")

  return normalizeGeminiAnalysis(parsedAnalysis, model)
}

export function getGeminiFallbackUserMessage(error: unknown) {
  if (error instanceof GeminiAnalysisError) {
    if (error.kind === "configuration") {
      return "AI analysis is not fully configured yet, so Aurora returned a cosmetic fallback report."
    }

    return "AI analysis is temporarily unavailable, so Aurora returned a cosmetic fallback report."
  }

  return "AI analysis was unavailable, so Aurora returned a cosmetic fallback report."
}

export function getGeminiDiagnosticMessage(error: unknown) {
  if (error instanceof GeminiAnalysisError) {
    return [error.message, error.providerMessage].filter(Boolean).join(" Provider detail: ")
  }

  return error instanceof Error ? error.message : "Unknown Gemini analysis failure."
}

function getGeminiModel() {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL
}

function getGeminiEndpoint(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`
}

function logGeminiDiagnostic(message: string, details?: Record<string, unknown>) {
  if (details) {
    console.info(`[Gemini] ${message}`, details)
    return
  }

  console.info(`[Gemini] ${message}`)
}

async function readGeminiPayload(response: Response, model: string): Promise<GeminiGenerateContentResponse> {
  try {
    return (await response.json()) as GeminiGenerateContentResponse
  } catch {
    throw new GeminiAnalysisError(
      "invalid_response",
      `Gemini returned a non-JSON response for model ${model}.`,
    )
  }
}

function classifyGeminiTransportError(error: unknown, model: string) {
  if (error instanceof DOMException && error.name === "AbortError") {
    return new GeminiAnalysisError("timeout", `Gemini request timed out for model ${model}.`)
  }

  return new GeminiAnalysisError(
    "network",
    `Gemini request could not be completed for model ${model}.`,
    error instanceof Error ? error.message : undefined,
  )
}

function classifyGeminiResponseError(
  response: Response,
  payload: GeminiGenerateContentResponse,
  model: string,
) {
  const providerMessage = payload.error?.message
  const normalizedProviderMessage = providerMessage?.toLowerCase() ?? ""

  if (response.status === 429 && isQuotaMessage(normalizedProviderMessage)) {
    return new GeminiAnalysisError(
      "quota",
      `Gemini quota is unavailable for configured model ${model}.`,
      providerMessage,
    )
  }

  if (response.status === 429) {
    return new GeminiAnalysisError(
      "rate_limit",
      `Gemini rate limit was reached for configured model ${model}.`,
      providerMessage,
    )
  }

  if (response.status === 401 || response.status === 403) {
    return new GeminiAnalysisError(
      "auth",
      `Gemini authentication or project access failed for configured model ${model}.`,
      providerMessage,
    )
  }

  return new GeminiAnalysisError(
    "unknown",
    `Gemini request failed with status ${response.status} for configured model ${model}.`,
    providerMessage,
  )
}

function isQuotaMessage(value: string) {
  return value.includes("quota") || value.includes("free_tier") || value.includes("resource_exhausted")
}

function buildCosmeticPrompt() {
  return [
    "You are Aurora SkinSense, a cosmetic skin wellness analysis assistant.",
    "Analyze the uploaded face image for visible cosmetic indicators only.",
    "Do not diagnose, identify diseases, mention medical conditions, prescribe treatment, or claim certainty.",
    "Use coarse bands only: low, balanced, mild, moderate, elevated, not_visible.",
    "Return strict JSON only. No markdown, no code fence, no extra commentary.",
    "JSON shape:",
    '{ "summary": string, "cosmeticFindings": [{ "label": string, "band": "low|balanced|mild|moderate|elevated|not_visible", "observation": string }], "routineTips": string[], "quality": { "lighting": "low|balanced|mild|moderate|elevated|not_visible", "framing": "clear|usable|unclear", "confidence": "low|medium|high" } }',
    "Include 4 cosmeticFindings using labels from: Visible texture, Hydration signs, Redness appearance, Pigmentation appearance, Radiance.",
    "Keep observations short, cosmetic-only, and privacy-first.",
  ].join("\n")
}

function parseGeminiJson(rawText: string, model: string): GeminiSkinAnalysisJson {
  try {
    return JSON.parse(stripJsonFence(rawText)) as GeminiSkinAnalysisJson
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown JSON parse error."
    logGeminiDiagnostic("JSON validation failed", {
      reason,
      model,
    })

    throw new GeminiAnalysisError("invalid_response", `Gemini returned invalid JSON for model ${model}.`, reason)
  }
}

function stripJsonFence(value: string) {
  return value
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()
}

function normalizeGeminiAnalysis(input: GeminiSkinAnalysisJson, model: string): ScanAnalysisReport {
  const findings = Array.isArray(input.cosmeticFindings) ? input.cosmeticFindings : []
  const routineTips = Array.isArray(input.routineTips) ? input.routineTips : []

  return {
    summary:
      typeof input.summary === "string" && input.summary.trim()
        ? input.summary.trim()
        : "Aurora prepared a cosmetic skin wellness report from the visible image indicators.",
    cosmeticFindings: normalizeFindings(findings),
    recommendations: [],
    routineTips: routineTips.length
      ? routineTips.slice(0, 5).map((tip) => sanitizeText(tip, "Keep routines gentle and consistent."))
      : [
          "Keep your routine gentle and consistent.",
          "Use daytime sun protection as a cosmetic wellness habit.",
          "Repeat scans in even lighting for clearer cosmetic guidance.",
        ],
    quality: {
      lighting: normalizeBand(input.quality?.lighting),
      framing: normalizeFraming(input.quality?.framing),
      confidence: normalizeConfidence(input.quality?.confidence),
    },
    disclaimer: DISCLAIMER,
    source: "gemini",
    model,
  }
}

function normalizeFindings(findings: GeminiSkinAnalysisJson["cosmeticFindings"]): ScanAnalysisReport["cosmeticFindings"] {
  const normalized = findings.slice(0, 6).map((finding) => ({
    label: sanitizeText(finding.label, "Cosmetic indicator"),
    band: normalizeBand(finding.band),
    observation: sanitizeText(
      finding.observation,
      "This visible indicator was reviewed as cosmetic wellness guidance only.",
    ),
  }))

  if (normalized.length > 0) return normalized

  return [
    {
      label: "Image quality",
      band: "not_visible",
      observation: "Gemini did not return a visible cosmetic finding for this area.",
    },
    {
      label: "Visible texture",
      band: "not_visible",
      observation: "Repeat the scan in even lighting for clearer cosmetic guidance.",
    },
  ]
}

function sanitizeText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}

function normalizeBand(value: unknown): GeminiBand {
  return typeof value === "string" && ALLOWED_BANDS.includes(value as GeminiBand)
    ? (value as GeminiBand)
    : "not_visible"
}

function normalizeFraming(value: unknown): ScanAnalysisReport["quality"]["framing"] {
  if (value === "clear" || value === "usable" || value === "unclear") return value
  return "unclear"
}

function normalizeConfidence(value: unknown): ScanAnalysisReport["quality"]["confidence"] {
  if (value === "low" || value === "medium" || value === "high") return value
  return "low"
}
