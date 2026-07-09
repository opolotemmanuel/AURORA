// Standalone recommendations endpoint (independent of the scan flow) —
// accepts either the "standard" request shape (findings[]/signals) or the
// older flat "legacy" shape, validates whichever one was sent, then
// normalizes both down to the flat CosmeticAnalysisInput the rule-based
// engine expects. See ParsedRecommendationRequest below.
import { NextResponse } from "next/server"

import { listActiveRecommendationProducts } from "@/lib/backend/product-service"
import {
  RECOMMENDATION_DISCLAIMER,
  buildRoutine,
  recommendAuroraProducts,
} from "@/lib/recommendations/recommendation-engine"
import type {
  CosmeticAnalysisInput,
  CosmeticFindingInput,
  RecommendationAnalysisInput,
  RecommendationContext,
  RecommendationErrorResponse,
  RecommendationPreferences,
  RecommendationRequest,
  RecommendationResponse,
  SkinConcern,
} from "@/lib/recommendations/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const cosmeticBands = ["low", "balanced", "mild", "moderate", "elevated", "not_visible"] as const
const skinProfiles = ["dry-feeling", "balanced", "oil-prone", "sensitive-feeling", "dull-looking"] as const
const climates = ["dry", "humid", "cold", "hot", "temperate"] as const
const routinePreferences = ["minimal", "standard", "complete"] as const
const concernFields = [
  "hydration",
  "texture",
  "rednessAppearance",
  "pigmentationAppearance",
  "oilBalance",
  "barrierComfort",
  "radiance",
  "daytimeProtection",
] as const satisfies readonly SkinConcern[]

type ParsedRecommendationRequest = {
  request: RecommendationRequest
  engineInput: CosmeticAnalysisInput
  limit: number | undefined
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json()
    const validation = parseRecommendationRequest(body)

    if (!validation.ok) {
      return jsonError(validation.error, 400)
    }

    const products = await listActiveRecommendationProducts()
    const recommendations = recommendAuroraProducts(validation.parsed.engineInput, validation.parsed.limit, products)

    return NextResponse.json<RecommendationResponse>({
      success: true,
      source: "rule-based",
      disclaimer: RECOMMENDATION_DISCLAIMER,
      recommendations,
      routine: buildRoutine(recommendations),
      nextBackendStep: products.length
        ? "Recommendations are ranked from active PostgreSQL product records."
        : "Add active products in the admin dashboard to enable product recommendations.",
    })
  } catch {
    return jsonError("Send a JSON body with an analysis object to receive Aurora recommendations.", 400)
  }
}

// Tries the standard shape first, then falls back to the legacy shape —
// whichever validates successfully wins. If both fail, the standard
// request's error is returned since it's the shape new callers should use.
function parseRecommendationRequest(body: unknown):
  | { ok: true; parsed: ParsedRecommendationRequest }
  | { ok: false; error: string } {
  if (!isRecord(body)) {
    return { ok: false, error: "Request body must be a JSON object." }
  }

  const standardRequest = parseStandardRequest(body)
  if (standardRequest.ok) return standardRequest

  const legacyRequest = parseLegacyRequest(body)
  if (legacyRequest.ok) return legacyRequest

  return { ok: false, error: standardRequest.error }
}

function parseStandardRequest(body: Record<string, unknown>):
  | { ok: true; parsed: ParsedRecommendationRequest }
  | { ok: false; error: string } {
  if (!isRecord(body.analysis)) {
    return { ok: false, error: "Request body must include an analysis object." }
  }

  const analysisValidation = parseRecommendationAnalysis(body.analysis)
  if (!analysisValidation.ok) return analysisValidation

  const contextValidation = parseContext(body.context)
  if (!contextValidation.ok) return contextValidation

  const preferencesValidation = parsePreferences(body.preferences)
  if (!preferencesValidation.ok) return preferencesValidation

  const request: RecommendationRequest = {
    analysis: analysisValidation.analysis,
    context: contextValidation.context,
    preferences: preferencesValidation.preferences,
  }

  return {
    ok: true,
    parsed: {
      request,
      engineInput: toCosmeticAnalysisInput(request),
      limit: preferencesValidation.preferences?.limit,
    },
  }
}

function parseLegacyRequest(body: Record<string, unknown>):
  | { ok: true; parsed: ParsedRecommendationRequest }
  | { ok: false; error: string } {
  if (!isRecord(body.analysis)) {
    return { ok: false, error: "Request body must include an analysis object." }
  }

  const analysisValidation = parseFlatAnalysis(body.analysis)
  if (!analysisValidation.ok) return analysisValidation

  const limitValidation = parseLimit(body.limit)
  if (!limitValidation.ok) return limitValidation

  const request: RecommendationRequest = {
    analysis: {
      signals: getSignalsFromFlatAnalysis(analysisValidation.analysis),
      skinProfile: analysisValidation.analysis.skinProfile,
    },
    context: {
      climate: analysisValidation.analysis.climate,
    },
    preferences: {
      routinePreference: analysisValidation.analysis.routinePreference,
      limit: limitValidation.limit,
    },
  }

  return {
    ok: true,
    parsed: {
      request,
      engineInput: analysisValidation.analysis,
      limit: limitValidation.limit,
    },
  }
}

function parseRecommendationAnalysis(input: Record<string, unknown>):
  | { ok: true; analysis: RecommendationAnalysisInput }
  | { ok: false; error: string } {
  const analysis: RecommendationAnalysisInput = {}

  if (input.signals !== undefined) {
    if (!isRecord(input.signals)) {
      return { ok: false, error: "analysis.signals must be an object of cosmetic concern bands." }
    }

    const signalsValidation = parseSignals(input.signals)
    if (!signalsValidation.ok) return signalsValidation
    analysis.signals = signalsValidation.signals
  }

  if (input.findings !== undefined) {
    if (!Array.isArray(input.findings)) {
      return { ok: false, error: "analysis.findings must be an array." }
    }

    const findingsValidation = parseFindings(input.findings)
    if (!findingsValidation.ok) return findingsValidation
    analysis.findings = findingsValidation.findings
  }

  if (!analysis.signals && !analysis.findings) {
    return { ok: false, error: "analysis must include findings or signals." }
  }

  if (input.skinProfile !== undefined) {
    if (!isOneOf(input.skinProfile, skinProfiles)) {
      return { ok: false, error: `analysis.skinProfile must be one of: ${skinProfiles.join(", ")}.` }
    }

    analysis.skinProfile = input.skinProfile
  }

  return { ok: true, analysis }
}

function parseFlatAnalysis(input: Record<string, unknown>):
  | { ok: true; analysis: CosmeticAnalysisInput }
  | { ok: false; error: string } {
  const analysis: CosmeticAnalysisInput = {}
  const signalsValidation = parseSignals(input)
  if (!signalsValidation.ok) return signalsValidation

  Object.assign(analysis, signalsValidation.signals)

  if (input.skinProfile !== undefined) {
    if (!isOneOf(input.skinProfile, skinProfiles)) {
      return { ok: false, error: `skinProfile must be one of: ${skinProfiles.join(", ")}.` }
    }
    analysis.skinProfile = input.skinProfile
  }

  if (input.climate !== undefined) {
    if (!isOneOf(input.climate, climates)) {
      return { ok: false, error: `climate must be one of: ${climates.join(", ")}.` }
    }
    analysis.climate = input.climate
  }

  if (input.routinePreference !== undefined) {
    if (!isOneOf(input.routinePreference, routinePreferences)) {
      return { ok: false, error: `routinePreference must be one of: ${routinePreferences.join(", ")}.` }
    }
    analysis.routinePreference = input.routinePreference
  }

  return { ok: true, analysis }
}

function parseSignals(input: Record<string, unknown>):
  | { ok: true; signals: Partial<Record<SkinConcern, CosmeticAnalysisInput[SkinConcern]>> }
  | { ok: false; error: string } {
  const signals: Partial<Record<SkinConcern, CosmeticAnalysisInput[SkinConcern]>> = {}

  for (const field of concernFields) {
    const value = input[field]
    if (value === undefined) continue

    if (!isOneOf(value, cosmeticBands)) {
      return { ok: false, error: `${field} must be one of: ${cosmeticBands.join(", ")}.` }
    }

    signals[field] = value
  }

  return { ok: true, signals }
}

function parseFindings(input: unknown[]):
  | { ok: true; findings: CosmeticFindingInput[] }
  | { ok: false; error: string } {
  const findings: CosmeticFindingInput[] = []

  for (const item of input) {
    if (!isRecord(item)) {
      return { ok: false, error: "Each analysis finding must be an object." }
    }

    if (!isOneOf(item.concern, concernFields)) {
      return { ok: false, error: `finding.concern must be one of: ${concernFields.join(", ")}.` }
    }

    if (!isOneOf(item.band, cosmeticBands)) {
      return { ok: false, error: `finding.band must be one of: ${cosmeticBands.join(", ")}.` }
    }

    if (item.observation !== undefined && typeof item.observation !== "string") {
      return { ok: false, error: "finding.observation must be a string when provided." }
    }

    findings.push({
      concern: item.concern,
      band: item.band,
      observation: item.observation,
    })
  }

  return { ok: true, findings }
}

function parseContext(value: unknown):
  | { ok: true; context: RecommendationContext | undefined }
  | { ok: false; error: string } {
  if (value === undefined) return { ok: true, context: undefined }

  if (!isRecord(value)) {
    return { ok: false, error: "context must be an object when provided." }
  }

  const context: RecommendationContext = {}

  if (value.scanId !== undefined) {
    if (typeof value.scanId !== "string") return { ok: false, error: "context.scanId must be a string." }
    context.scanId = value.scanId
  }

  if (value.reportId !== undefined) {
    if (typeof value.reportId !== "string") return { ok: false, error: "context.reportId must be a string." }
    context.reportId = value.reportId
  }

  if (value.userId !== undefined) {
    if (typeof value.userId !== "string") return { ok: false, error: "context.userId must be a string." }
    context.userId = value.userId
  }

  if (value.climate !== undefined) {
    if (!isOneOf(value.climate, climates)) {
      return { ok: false, error: `context.climate must be one of: ${climates.join(", ")}.` }
    }
    context.climate = value.climate
  }

  return { ok: true, context }
}

function parsePreferences(value: unknown):
  | { ok: true; preferences: RecommendationPreferences | undefined }
  | { ok: false; error: string } {
  if (value === undefined) return { ok: true, preferences: undefined }

  if (!isRecord(value)) {
    return { ok: false, error: "preferences must be an object when provided." }
  }

  const preferences: RecommendationPreferences = {}

  if (value.routinePreference !== undefined) {
    if (!isOneOf(value.routinePreference, routinePreferences)) {
      return { ok: false, error: `preferences.routinePreference must be one of: ${routinePreferences.join(", ")}.` }
    }

    preferences.routinePreference = value.routinePreference
  }

  const limitValidation = parseLimit(value.limit)
  if (!limitValidation.ok) return limitValidation
  preferences.limit = limitValidation.limit

  return { ok: true, preferences }
}

function parseLimit(value: unknown): { ok: true; limit: number | undefined } | { ok: false; error: string } {
  if (value === undefined) return { ok: true, limit: undefined }

  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 5) {
    return { ok: false, error: "Optional limit must be an integer from 1 to 5." }
  }

  return { ok: true, limit: value }
}

// Where the standard request shape actually gets flattened into what
// recommendation-engine.ts consumes — findings[] and signals both collapse
// into the same per-concern band map (findings win if both are present,
// since they're spread after signals).
function toCosmeticAnalysisInput(request: RecommendationRequest): CosmeticAnalysisInput {
  return {
    ...request.analysis.signals,
    ...getSignalsFromFindings(request.analysis.findings),
    skinProfile: request.analysis.skinProfile,
    climate: request.context?.climate,
    routinePreference: request.preferences?.routinePreference,
  }
}

function getSignalsFromFindings(findings: CosmeticFindingInput[] | undefined) {
  if (!findings) return {}

  return findings.reduce<Partial<Record<SkinConcern, CosmeticAnalysisInput[SkinConcern]>>>((signals, finding) => {
    signals[finding.concern] = finding.band
    return signals
  }, {})
}

function getSignalsFromFlatAnalysis(analysis: CosmeticAnalysisInput) {
  return {
    hydration: analysis.hydration,
    texture: analysis.texture,
    rednessAppearance: analysis.rednessAppearance,
    pigmentationAppearance: analysis.pigmentationAppearance,
    oilBalance: analysis.oilBalance,
    barrierComfort: analysis.barrierComfort,
    radiance: analysis.radiance,
    daytimeProtection: analysis.daytimeProtection,
  }
}

function jsonError(error: string, status: number) {
  return NextResponse.json<RecommendationErrorResponse>(
    {
      success: false,
      error,
    },
    { status },
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isOneOf<const T extends readonly string[]>(value: unknown, allowed: T): value is T[number] {
  return typeof value === "string" && allowed.includes(value)
}
