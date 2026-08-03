// The one AI adapter module (per AGENTS.md: "All vision/text model calls go
// through one adapter file"). Calls Gemini's REST API directly over fetch
// (no SDK dependency) and normalizes whatever comes back into the app's own
// ScanAnalysisReport shape, so callers never see Gemini-specific types.
import type { ScanAnalysisReport } from "@/lib/backend/types"
import type { ClimateSnapshot } from "@/lib/climate/adapter"

// Overridable via GEMINI_MODEL env var (see .env.local) without a code
// change — lets the model be bumped without redeploying the adapter itself.
const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash"
const GEMINI_TIMEOUT_MS = 20000
const DISCLAIMER =
  "Aurora SkinSense provides cosmetic wellness guidance only. This is not a medical diagnosis, treatment plan, or substitute for professional medical advice."
// The only bands the app will ever surface — enforces the "coarse, honest
// output only" rule from AGENTS.md even if the model tries to return
// something more specific/numeric.
const ALLOWED_BANDS = [
  "low",
  "balanced",
  "mild",
  "moderate",
  "elevated",
  "not_visible",
] as const

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
    readonly providerMessage?: string
  ) {
    super(message)
    this.name = "GeminiAnalysisError"
  }
}

// Sends the captured image to Gemini and returns a normalized cosmetic
// report. Throws GeminiAnalysisError (never a raw fetch/parse error) so
// callers (lib/backend/scan-service.ts) can pattern-match on `.kind` and
// decide when to fall back to the non-AI cosmetic report.
//
// Unchanged behavior/signature/error-contract — only its internal HTTP call
// now goes through the shared callGeminiGenerateContent helper below (added
// for askAboutReport, see further down) instead of duplicating the
// fetch/timeout/error-classification logic a second time.
export async function analyzeSkinWithGemini(
  image: File,
  climate?: ClimateSnapshot | null
): Promise<ScanAnalysisReport> {
  const apiKey = process.env.GEMINI_API_KEY
  const model = getGeminiModel()

  logGeminiDiagnostic("Request starting", {
    hasApiKey: Boolean(apiKey),
    model,
    imageMimeType: image.type || "image/jpeg",
    imageSizeBytes: image.size,
    hasClimateContext: Boolean(climate),
  })

  if (!apiKey) {
    throw new GeminiAnalysisError("configuration", "GEMINI_API_KEY is missing.")
  }

  // Gemini's REST API takes inline image bytes as base64, not multipart.
  const imageBase64 = Buffer.from(await image.arrayBuffer()).toString("base64")

  const request = {
    model,
    apiKey,
    contents: [
      {
        role: "user",
        parts: [
          { text: buildCosmeticPrompt(climate) },
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
      // Ask Gemini to return JSON directly (fewer markdown-fence/parse
      // surprises) with low temperature for consistent, non-creative
      // cosmetic wording, and a token cap since responses are meant to
      // stay short (coarse bands + brief observations, not essays).
      responseMimeType: "application/json",
      temperature: 0.2,
      maxOutputTokens: 1200,
    },
  }

  // Gemini's JSON-mode output is occasionally syntactically broken (a
  // missing `}` between array elements — see parseGeminiJson's repair pass)
  // even with finishReason "STOP" and no truncation — this is model output
  // flakiness, not a deterministic bug, so a second identical call often
  // just succeeds cleanly. One retry only: a real API call costs real spend
  // and latency, and the existing fallback path already handles a
  // still-broken second response honestly.
  try {
    const rawText = await callGeminiGenerateContent(request)
    const parsedAnalysis = parseGeminiJson(rawText, model)
    logGeminiDiagnostic("Gemini response received")
    return normalizeGeminiAnalysis(parsedAnalysis, model)
  } catch (firstError) {
    if (
      !(firstError instanceof GeminiAnalysisError) ||
      firstError.kind !== "invalid_response"
    ) {
      throw firstError
    }

    logGeminiDiagnostic("Retrying after parse failure", { model })

    try {
      const rawText = await callGeminiGenerateContent(request)
      const parsedAnalysis = parseGeminiJson(rawText, model)
      logGeminiDiagnostic("Retry after parse failure: succeeded", { model })
      return normalizeGeminiAnalysis(parsedAnalysis, model)
    } catch (secondError) {
      logGeminiDiagnostic("Retry after parse failure: failed", { model })
      throw secondError
    }
  }
}

// Shared by both buildReportChatSystemPrompt and buildSkinAdviceSystemPrompt
// so the formatting rule and the "only recommend real products" rule can't
// drift apart between the two chats. The exact heading text
// "**Suggested products:**" is a fixed contract with
// lib/recommendations/chat-product-mentions.ts's extractSuggestedProducts,
// which parses a response for that literal (case-insensitive) heading
// followed by a bullet list — changing the wording here without updating
// that parser (or vice versa) would silently stop product matching.
function buildFormattingAndProductGuidance(products: ChatCatalogProduct[]): string[] {
  return [
    "Formatting: respond in clean markdown — short paragraphs, **bold** for key terms, and bullet points for any list (routine steps, multiple tips). Avoid long unbroken paragraphs. Keep the whole answer concise, like a chat reply, not an essay.",
    "",
    "Real Aurora Organics products you may recommend (this is the ONLY list you may ever recommend from — never invent a product name, and never imply a product exists or is available if it isn't listed here):",
    ...(products.length
      ? products.map((product) => {
          const ingredientsNote = product.keyIngredients?.length
            ? ` — key ingredients: ${product.keyIngredients.join(", ")}`
            : ""
          return `- ${product.name} (${product.category}) — helps with: ${product.bestFor.join(", ") || "general routine support"}${ingredientsNote}`
        })
      : ["- (No active products available right now — do not suggest any product.)"]),
    // Same "never invent" discipline as the product list itself, extended one
    // level deeper: an ingredient listed above is real (from Aurora's own
    // product data), but only mention it — and only describe its role in
    // general, non-medical cosmetic terms (e.g. "commonly used to help with
    // X") — when a product's own listed ingredients are genuinely relevant to
    // what the user asked. Never invent an ingredient a product doesn't have
    // listed above, and never claim a product contains an ingredient it
    // isn't listed with here, even if it sounds plausible.
    "Each product above may list its key ingredients. You may mention a listed ingredient and its general, well-known cosmetic role when it's genuinely relevant to the question — but only ingredients actually listed for that product, never a plausible-sounding one you're inferring, and never a medical claim (no \"treats,\" \"cures,\" or clinical statistics) about what it does.",
    'When, and only when, the question is genuinely about a skin concern one of the products above addresses, end your answer with a section starting on its own line with exactly "**Suggested products:**" followed by a markdown bullet list of 1-3 of the products above. Each bullet must contain ONLY the exact product name copied from the list above — no price, no description, no link, nothing else on that line.',
    "If no listed product is genuinely relevant to the question, or the question is general/educational rather than something a product addresses, skip the \"Suggested products\" section entirely — never force an irrelevant recommendation.",
  ]
}

export type ReportChatRole = "user" | "assistant"
export type ReportChatTurn = { role: ReportChatRole; content: string }

// Only what askAboutReport needs to ground its answers — deliberately a
// narrow projection of ScanAnalysisReport/RecommendationMatch, not those
// types themselves, so this adapter stays decoupled from the report/
// recommendation domain modules (see AGENTS.md: don't mix domains).
export type ReportChatContext = {
  summary: string
  cosmeticFindings: Array<{ label: string; band: string; observation: string }>
  recommendations: Array<{ name: string; category: string; reason: string }>
  products: ChatCatalogProduct[]
}

// Narrow projection of AuroraProduct — same decoupling reasoning as
// ReportChatContext above. Callers (the chat API routes) build this from the
// real active catalog (lib/backend/product-service.ts); matching the model's
// eventual "Suggested products" mentions back to real rows happens
// separately, after the model responds (see
// lib/recommendations/chat-product-mentions.ts), so this adapter never needs
// to know about images, prices, or purchase links — only enough to judge
// relevance.
export type ChatCatalogProduct = {
  name: string
  category: string
  bestFor: string[]
  // Real named actives from Product.keyIngredients (lib/products/
  // ingredients.ts) — undefined/empty for the products that don't have any
  // recognized ingredient in the catalog, same graceful-omission pattern as
  // everywhere else this app handles sparse data.
  keyIngredients?: string[]
}

export const REPORT_CHAT_MAX_QUESTION_LENGTH = 600

export class ReportChatQuestionTooLongError extends Error {
  constructor() {
    super(
      `Question must be ${REPORT_CHAT_MAX_QUESTION_LENGTH} characters or fewer.`
    )
    this.name = "ReportChatQuestionTooLongError"
  }
}

// Multi-turn follow-up chat about one specific report. Gemini's REST API is
// stateless — there's no server-side session to resume — so "multi-turn"
// means resending the full prior history as `contents` on every call; the
// caller (the chat API route) is responsible for loading that history from
// ReportChatMessage and appending the new turn before persisting anything.
export async function askAboutReport(
  context: ReportChatContext,
  history: ReportChatTurn[],
  question: string
): Promise<string> {
  if (question.length > REPORT_CHAT_MAX_QUESTION_LENGTH) {
    throw new ReportChatQuestionTooLongError()
  }

  const apiKey = process.env.GEMINI_API_KEY
  const model = getGeminiModel()

  if (!apiKey) {
    throw new GeminiAnalysisError("configuration", "GEMINI_API_KEY is missing.")
  }

  const rawText = await callGeminiGenerateContent({
    model,
    apiKey,
    systemInstruction: buildReportChatSystemPrompt(context),
    contents: [
      ...history.map((turn) => ({
        role: turn.role === "user" ? "user" : "model",
        parts: [{ text: turn.content }],
      })),
      { role: "user", parts: [{ text: question }] },
    ],
    generationConfig: {
      // Higher temperature than the analysis call (0.2) since this is
      // conversational text, not a structured extraction — but still capped
      // and short, matching the rest of the app's brief, non-essay tone.
      temperature: 0.4,
      // 500 (this call's original cap) turned out too tight once the system
      // prompt started asking for markdown formatting + a possible
      // "Suggested products" section: gemini-2.5-flash's internal "thinking"
      // tokens draw from this same budget, so the visible answer was
      // sometimes cut off mid-sentence before finishing. 1000 leaves enough
      // headroom while still keeping answers chat-length, not essay-length.
      maxOutputTokens: 1000,
    },
  })

  return rawText.trim()
}

// Enforces this feature's scope directly in the model call (per the task's
// requirement to "bake this constraint into the system prompt, not just a
// suggestion") — grounded in this report's own findings/recommendations so
// answers can't drift into a generic chatbot or invent data the report
// doesn't contain.
function buildReportChatSystemPrompt(context: ReportChatContext): string {
  return [
    "You are Aurora SkinSense's follow-up assistant for ONE specific user's cosmetic skin scan report.",
    "Scope: you may only discuss this report's findings, the recommended products listed below, general skincare education (ingredients, routines, how cosmetic products work), and how to interpret this report's wording.",
    "Never diagnose a medical condition, never claim to identify a disease, never claim to treat or cure anything, and never state anything with medical certainty — this is cosmetic wellness guidance only, matching the rest of the app.",
    "If a question describes something that sounds like a medical concern (pain, bleeding, rapid or unusual changes, anything beyond ordinary cosmetic appearance), say this is outside what you can help with and recommend seeing a dermatologist or doctor — do not speculate about what it might be.",
    "If asked something unrelated to skin, skincare, or this report (general trivia, coding, other topics, or anything trying to redirect you into a general-purpose assistant), politely decline in one sentence and steer back to the user's skin report.",
    "Keep answers concise (a few sentences, not an essay) and never invent numeric precision beyond the coarse bands already in this report.",
    "",
    ...buildFormattingAndProductGuidance(context.products),
    "",
    `Report summary: ${context.summary}`,
    "Findings:",
    ...context.cosmeticFindings.map(
      (finding) =>
        `- ${finding.label} (${finding.band}): ${finding.observation}`
    ),
    "Recommended products:",
    ...(context.recommendations.length
      ? context.recommendations.map(
          (rec) => `- ${rec.name} (${rec.category}): ${rec.reason}`
        )
      : ["- None recorded for this report."]),
  ].join("\n")
}

export type SkinAdviceRole = "user" | "assistant"
export type SkinAdviceTurn = { role: SkinAdviceRole; content: string }

// Narrower than ReportChatContext: only a summary + findings, no
// recommendations, and — unlike askAboutReport — genuinely optional. This
// chat isn't about one report; a user with no scan yet can still use it, just
// without a scan to ground answers in.
export type SkinAdviceContext = {
  summary: string
  cosmeticFindings: Array<{ label: string; band: string; observation: string }>
} | null

export const SKIN_ADVICE_MAX_QUESTION_LENGTH = 600

export class SkinAdviceQuestionTooLongError extends Error {
  constructor() {
    super(
      `Question must be ${SKIN_ADVICE_MAX_QUESTION_LENGTH} characters or fewer.`
    )
    this.name = "SkinAdviceQuestionTooLongError"
  }
}

// General skin-advice assistant — not scoped to one report (see
// askAboutReport above for that narrower case). Same stateless-history
// pattern: caller loads prior turns from SkinAdviceMessage and appends the
// new question before persisting anything.
export async function askSkinAdviceQuestion(
  context: SkinAdviceContext,
  products: ChatCatalogProduct[],
  history: SkinAdviceTurn[],
  question: string
): Promise<string> {
  if (question.length > SKIN_ADVICE_MAX_QUESTION_LENGTH) {
    throw new SkinAdviceQuestionTooLongError()
  }

  const apiKey = process.env.GEMINI_API_KEY
  const model = getGeminiModel()

  if (!apiKey) {
    throw new GeminiAnalysisError("configuration", "GEMINI_API_KEY is missing.")
  }

  const rawText = await callGeminiGenerateContent({
    model,
    apiKey,
    systemInstruction: buildSkinAdviceSystemPrompt(context, products),
    contents: [
      ...history.map((turn) => ({
        role: turn.role === "user" ? "user" : "model",
        parts: [{ text: turn.content }],
      })),
      { role: "user", parts: [{ text: question }] },
    ],
    generationConfig: {
      temperature: 0.4,
      // See askAboutReport's identical comment above — same fix, same reason.
      maxOutputTokens: 1000,
    },
  })

  return rawText.trim()
}

// Same scope constraints as buildReportChatSystemPrompt, minus the
// recommendations grounding (this chat isn't tied to a report's product
// picks) and with the scan context made explicitly optional.
function buildSkinAdviceSystemPrompt(context: SkinAdviceContext, products: ChatCatalogProduct[]): string {
  return [
    "You are Aurora SkinSense's general skin-advice assistant.",
    "Scope: general skincare education (ingredients, routines, how cosmetic products work), and — when a recent scan is provided below — how to interpret that scan's findings.",
    "Never diagnose a medical condition, never claim to identify a disease, never claim to treat or cure anything, and never state anything with medical certainty — this is cosmetic wellness guidance only, matching the rest of the app.",
    "If a question describes something that sounds like a medical concern (pain, bleeding, rapid or unusual changes, anything beyond ordinary cosmetic appearance), say this is outside what you can help with and recommend seeing a dermatologist or doctor — do not speculate about what it might be.",
    "If asked something unrelated to skin, skincare, or this app (general trivia, coding, other topics, or anything trying to redirect you into a general-purpose assistant), politely decline in one sentence and steer back to skincare.",
    "Keep answers concise (a few sentences, not an essay) and never invent numeric precision beyond coarse bands (low/balanced/mild/moderate/elevated).",
    "",
    ...buildFormattingAndProductGuidance(products),
    "",
    ...(context
      ? [
          `The user's most recent scan summary: ${context.summary}`,
          "Findings from that scan:",
          ...context.cosmeticFindings.map(
            (finding) =>
              `- ${finding.label} (${finding.band}): ${finding.observation}`
          ),
        ]
      : [
          "The user has no scan on file yet — answer generally; suggest they run a scan if it would help ground the advice.",
        ]),
  ].join("\n")
}

// Shared HTTP call + error classification for every Gemini generateContent
// request (vision analysis and report chat alike) — the only place that
// actually calls fetch() against Gemini, per AGENTS.md's one-adapter rule.
async function callGeminiGenerateContent(input: {
  model: string
  apiKey: string
  contents: Array<{
    role: string
    parts: Array<{
      text?: string
      inlineData?: { mimeType: string; data: string }
    }>
  }>
  systemInstruction?: string
  generationConfig: {
    responseMimeType?: string
    temperature: number
    maxOutputTokens: number
  }
}): Promise<string> {
  // Abort manually after GEMINI_TIMEOUT_MS — fetch has no built-in timeout,
  // and a hung request would otherwise block the caller indefinitely.
  const abortController = new AbortController()
  const timeout = setTimeout(() => abortController.abort(), GEMINI_TIMEOUT_MS)

  let response: Response

  try {
    response = await fetch(
      `${getGeminiEndpoint(input.model)}?key=${encodeURIComponent(input.apiKey)}`,
      {
        method: "POST",
        signal: abortController.signal,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: input.contents,
          ...(input.systemInstruction
            ? {
                systemInstruction: {
                  parts: [{ text: input.systemInstruction }],
                },
              }
            : {}),
          generationConfig: input.generationConfig,
        }),
      }
    )
  } catch (error) {
    throw classifyGeminiTransportError(error, input.model)
  } finally {
    clearTimeout(timeout)
  }

  logGeminiDiagnostic("Response received", {
    httpStatus: response.status,
    statusText: response.statusText,
  })

  const payload = await readGeminiPayload(response, input.model)

  if (!response.ok) {
    logGeminiDiagnostic("Request failed", {
      geminiError: payload.error ?? null,
    })

    throw classifyGeminiResponseError(response, payload, input.model)
  }

  const rawText = payload.candidates?.[0]?.content?.parts?.find(
    (part) => part.text
  )?.text
  if (!rawText) {
    throw new GeminiAnalysisError(
      "invalid_response",
      `Gemini returned no content for model ${input.model}.`
    )
  }

  return rawText
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
    return [error.message, error.providerMessage]
      .filter(Boolean)
      .join(" Provider detail: ")
  }

  return error instanceof Error
    ? error.message
    : "Unknown Gemini analysis failure."
}

export function getGeminiModel() {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL
}

function getGeminiEndpoint(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`
}

function logGeminiDiagnostic(
  message: string,
  details?: Record<string, unknown>
) {
  if (details) {
    console.info(`[Gemini] ${message}`, details)
    return
  }

  console.info(`[Gemini] ${message}`)
}

async function readGeminiPayload(
  response: Response,
  model: string
): Promise<GeminiGenerateContentResponse> {
  try {
    return (await response.json()) as GeminiGenerateContentResponse
  } catch {
    throw new GeminiAnalysisError(
      "invalid_response",
      `Gemini returned a non-JSON response for model ${model}.`
    )
  }
}

// Errors thrown by `fetch` itself (network down, DNS failure, or our own
// AbortController firing) — distinct from classifyGeminiResponseError below,
// which handles a completed HTTP response that Gemini returned as an error.
function classifyGeminiTransportError(error: unknown, model: string) {
  if (error instanceof DOMException && error.name === "AbortError") {
    return new GeminiAnalysisError(
      "timeout",
      `Gemini request timed out for model ${model}.`
    )
  }

  return new GeminiAnalysisError(
    "network",
    `Gemini request could not be completed for model ${model}.`,
    error instanceof Error ? error.message : undefined
  )
}

// Gemini uses HTTP 429 for both "you're out of quota" and "you're sending
// requests too fast" — the status code alone can't tell them apart, so this
// inspects the provider's error message text to pick the right
// GeminiFailureKind (callers treat quota exhaustion differently from a
// transient rate limit).
function classifyGeminiResponseError(
  response: Response,
  payload: GeminiGenerateContentResponse,
  model: string
) {
  const providerMessage = payload.error?.message
  const normalizedProviderMessage = providerMessage?.toLowerCase() ?? ""

  if (response.status === 429 && isQuotaMessage(normalizedProviderMessage)) {
    return new GeminiAnalysisError(
      "quota",
      `Gemini quota is unavailable for configured model ${model}.`,
      providerMessage
    )
  }

  if (response.status === 429) {
    return new GeminiAnalysisError(
      "rate_limit",
      `Gemini rate limit was reached for configured model ${model}.`,
      providerMessage
    )
  }

  if (response.status === 401 || response.status === 403) {
    return new GeminiAnalysisError(
      "auth",
      `Gemini authentication or project access failed for configured model ${model}.`,
      providerMessage
    )
  }

  return new GeminiAnalysisError(
    "unknown",
    `Gemini request failed with status ${response.status} for configured model ${model}.`,
    providerMessage
  )
}

function isQuotaMessage(value: string) {
  return (
    value.includes("quota") ||
    value.includes("free_tier") ||
    value.includes("resource_exhausted")
  )
}

// The prompt is where the "not a medical diagnostic tool" / coarse-bands
// rule (AGENTS.md Non-Negotiables) actually gets enforced on the model side
// — normalizeGeminiAnalysis below is the second, code-level enforcement of
// the same rule in case the model doesn't comply.
//
// Climate/routineTips boundary: this stays ONE prompt/ONE call (no second
// API call — routine-tip generation and finding generation cannot be
// separated into two model calls without doubling Gemini spend per scan),
// but the two instruction sets are still structurally separated within it,
// not just appended as an afterthought:
//   1. Every cosmeticFindings instruction is given first, complete on its
//      own, with a hard rule stated before climate is ever mentioned.
//   2. Climate — if present — only appears afterward, in its own clearly
//      labeled block that explicitly scopes it to routineTips only.
//   3. The no-influence rule is restated immediately after the climate
//      block too, right before the JSON-shape instruction, so it's the
//      last thing read before the model must commit to an answer, not
//      just the first.
// This is a prompt-engineering mitigation, not a guarantee — see this
// feature's isolation test (same image, varying climate context, comparing
// cosmeticFindings across runs) before treating climate-aware tips as safe
// to ship.
function buildCosmeticPrompt(climate?: ClimateSnapshot | null) {
  const lines = [
    "You are Aurora SkinSense, a cosmetic skin wellness analysis assistant.",
    "Analyze the uploaded face image for visible cosmetic indicators only.",
    "Do not diagnose, identify diseases, mention medical conditions, prescribe treatment, or claim certainty.",
    "Use coarse bands only: low, balanced, mild, moderate, elevated, not_visible.",
    "",
    "HARD RULE for cosmeticFindings: every cosmeticFindings band and observation must be based SOLELY on what is visibly present in the uploaded image. Nothing else described anywhere in this prompt — including any weather/climate context that may appear below — may ever influence a cosmeticFindings band or observation, for any reason.",
    "Include 4 cosmeticFindings using labels from: Visible texture, Hydration signs, Redness appearance, Pigmentation appearance, Radiance.",
    "Keep observations short, cosmetic-only, and privacy-first.",
  ]

  if (climate) {
    lines.push(
      "",
      "ADDITIONAL CONTEXT — for routineTips ONLY, never for cosmeticFindings:",
      `Today's local weather where this scan was taken: ${Math.round(climate.temperatureC)}°C, ${Math.round(climate.humidityPercent)}% relative humidity, UV index ${Math.round(climate.uvIndex)}.`,
      "You may use this weather context only to make routineTips more practically useful — for example, suggest daytime SPF emphasis if UV is high, lightweight/oil-controlling products if humidity is high, or a richer moisturizer if it is cold or dry. Keep tips general cosmetic wellness habits, never a medical claim.",
      "REMINDER: this weather context must NEVER change a cosmeticFindings band or observation. Write cosmeticFindings exactly as you would if this weather context were not provided at all."
    )
  }

  lines.push(
    "",
    "Return strict JSON only. No markdown, no code fence, no extra commentary.",
    "JSON shape:",
    '{ "summary": string, "cosmeticFindings": [{ "label": string, "band": "low|balanced|mild|moderate|elevated|not_visible", "observation": string }], "routineTips": string[], "quality": { "lighting": "low|balanced|mild|moderate|elevated|not_visible", "framing": "clear|usable|unclear", "confidence": "low|medium|high" } }'
  )

  return lines.join("\n")
}

function parseGeminiJson(
  rawText: string,
  model: string
): GeminiSkinAnalysisJson {
  const cleaned = stripJsonFence(rawText)

  try {
    return JSON.parse(cleaned) as GeminiSkinAnalysisJson
  } catch (firstError) {
    const repaired = repairMissingBraceBeforeArrayElement(cleaned)

    if (repaired !== cleaned) {
      try {
        const repairedParsed: unknown = JSON.parse(repaired)

        if (isGeminiSkinAnalysisShape(repairedParsed)) {
          logGeminiDiagnostic("JSON repaired after parse failure", { model })
          return repairedParsed
        }

        logGeminiDiagnostic(
          "JSON repair produced valid JSON but an unexpected shape",
          { model }
        )
      } catch {
        // Repaired text still doesn't parse — fall through to the original
        // parse error below, same as if no repair had been attempted.
      }
    }

    const reason =
      firstError instanceof Error
        ? firstError.message
        : "Unknown JSON parse error."
    logGeminiDiagnostic("JSON validation failed", {
      reason,
      model,
    })

    throw new GeminiAnalysisError(
      "invalid_response",
      `Gemini returned invalid JSON for model ${model}.`,
      reason
    )
  }
}

// Narrow, targeted repair for one specific failure pattern actually observed
// in production logs: Gemini occasionally omits the closing `}` of an array
// element right before the next element starts —
//   "observation": "..."
//   ,
//   {
// — a missing `}` between the closing quote and the comma. This is NOT a
// general "fix any broken JSON" parser (that's a rabbit hole that risks
// silently accepting garbage) — it only inserts `}` in this exact
// close-quote/whitespace/comma/whitespace/open-brace shape, which never
// occurs in valid JSON: a well-formed array of objects always has `}`
// there already (e.g. `{"a":1}, {"b":2}`), so this can't misfire on
// correctly-formed output.
function repairMissingBraceBeforeArrayElement(value: string): string {
  return value.replace(/"(\s*),(\s*)\{/g, '"$1},$2{')
}

// Gate for accepting a repaired parse — "it parses" isn't enough on its
// own (a repair could produce valid-but-wrong JSON, e.g. `{}`), so this
// checks the same fields normalizeGeminiAnalysis actually depends on before
// treating a repair as a real success rather than a lucky-looking accident.
function isGeminiSkinAnalysisShape(
  value: unknown
): value is GeminiSkinAnalysisJson {
  if (typeof value !== "object" || value === null) return false
  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.summary === "string" &&
    Array.isArray(candidate.cosmeticFindings) &&
    candidate.cosmeticFindings.length > 0 &&
    candidate.cosmeticFindings.every(isGeminiFindingShape) &&
    Array.isArray(candidate.routineTips) &&
    typeof candidate.quality === "object" &&
    candidate.quality !== null
  )
}

function isGeminiFindingShape(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false
  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.label === "string" &&
    typeof candidate.band === "string" &&
    typeof candidate.observation === "string"
  )
}

// Gemini is asked for raw JSON (responseMimeType above) but sometimes wraps
// it in a ```json ... ``` code fence anyway — strip that before parsing.
function stripJsonFence(value: string) {
  return value
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()
}

// Even with JSON mode and a strict prompt, Gemini's output isn't
// schema-guaranteed — every field is validated/coerced here (rather than
// trusted as-is) before it becomes the report shown to the user or stored.
// `recommendations` is always empty because that's populated separately by
// lib/recommendations/*, not by the model.
function normalizeGeminiAnalysis(
  input: GeminiSkinAnalysisJson,
  model: string
): ScanAnalysisReport {
  const findings = Array.isArray(input.cosmeticFindings)
    ? input.cosmeticFindings
    : []
  const routineTips = Array.isArray(input.routineTips) ? input.routineTips : []

  return {
    summary:
      typeof input.summary === "string" && input.summary.trim()
        ? input.summary.trim()
        : "Aurora prepared a cosmetic skin wellness report from the visible image indicators.",
    cosmeticFindings: normalizeFindings(findings),
    recommendations: [],
    routineTips: routineTips.length
      ? routineTips
          .slice(0, 5)
          .map((tip) =>
            sanitizeText(tip, "Keep routines gentle and consistent.")
          )
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

function normalizeFindings(
  findings: GeminiSkinAnalysisJson["cosmeticFindings"]
): ScanAnalysisReport["cosmeticFindings"] {
  const normalized = findings.slice(0, 6).map((finding) => ({
    label: sanitizeText(finding.label, "Cosmetic indicator"),
    band: normalizeBand(finding.band),
    observation: sanitizeText(
      finding.observation,
      "This visible indicator was reviewed as cosmetic wellness guidance only."
    ),
  }))

  if (normalized.length > 0) return normalized

  return [
    {
      label: "Image quality",
      band: "not_visible",
      observation:
        "Gemini did not return a visible cosmetic finding for this area.",
    },
    {
      label: "Visible texture",
      band: "not_visible",
      observation:
        "Repeat the scan in even lighting for clearer cosmetic guidance.",
    },
  ]
}

function sanitizeText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}

function normalizeBand(value: unknown): GeminiBand {
  return typeof value === "string" &&
    ALLOWED_BANDS.includes(value as GeminiBand)
    ? (value as GeminiBand)
    : "not_visible"
}

function normalizeFraming(
  value: unknown
): ScanAnalysisReport["quality"]["framing"] {
  if (value === "clear" || value === "usable" || value === "unclear")
    return value
  return "unclear"
}

function normalizeConfidence(
  value: unknown
): ScanAnalysisReport["quality"]["confidence"] {
  if (value === "low" || value === "medium" || value === "high") return value
  return "low"
}
