import type { AiProvider, Prisma } from "@/generated/prisma/client"

import { prisma } from "@/lib/db/client"
import { getMinScanCredits, getScanTokenCost } from "@/lib/scan/constants"

export type UsageInput = {
  provider: AiProvider
  modelId: string
  inputTokens: number
  outputTokens: number
  cachedTokens?: number
}

export type PricingBreakdown = {
  inputMicros: number
  outputMicros: number
  cachedMicros: number
}

export type PricingResult = {
  credits: number
  costMicros: number
  marginMicros: number
  method: "usage" | "flat_fallback"
  breakdown: PricingBreakdown
}

export function getCreditValueMicros(): number {
  const raw = process.env.AURA_CREDIT_MICRO_USD
  const parsed = raw ? Number.parseInt(raw, 10) : 1000
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1000
}

export function getPricingMarginBps(): number {
  const raw = process.env.PRICING_MARGIN_BPS
  const parsed = raw ? Number.parseInt(raw, 10) : 2000
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 2000
}

function hasMeteredUsage(usage: UsageInput): boolean {
  return (
    usage.inputTokens > 0 ||
    usage.outputTokens > 0 ||
    (usage.cachedTokens ?? 0) > 0
  )
}

function computeCostMicros(
  usage: UsageInput,
  rate: {
    inputMicrosPer1M: number
    outputMicrosPer1M: number
    cachedInputMicrosPer1M: number
  },
): PricingBreakdown {
  const inputMicros = Math.ceil(
    (usage.inputTokens * rate.inputMicrosPer1M) / 1_000_000,
  )
  const outputMicros = Math.ceil(
    (usage.outputTokens * rate.outputMicrosPer1M) / 1_000_000,
  )
  const cachedMicros = Math.ceil(
    ((usage.cachedTokens ?? 0) * rate.cachedInputMicrosPer1M) / 1_000_000,
  )

  return { inputMicros, outputMicros, cachedMicros }
}

function flatFallbackResult(): PricingResult {
  const credits = getScanTokenCost()
  return {
    credits,
    costMicros: 0,
    marginMicros: 0,
    method: "flat_fallback",
    breakdown: { inputMicros: 0, outputMicros: 0, cachedMicros: 0 },
  }
}

export async function computeScanCreditCost(
  usage: UsageInput,
): Promise<PricingResult> {
  if (!hasMeteredUsage(usage)) {
    return flatFallbackResult()
  }

  const rate = await prisma.aiModelRate.findFirst({
    where: {
      provider: usage.provider,
      modelId: usage.modelId,
      isActive: true,
    },
  })

  if (!rate) {
    return flatFallbackResult()
  }

  const breakdown = computeCostMicros(usage, rate)
  const costMicros =
    breakdown.inputMicros + breakdown.outputMicros + breakdown.cachedMicros

  const marginBps = getPricingMarginBps()
  const marginMicros = Math.ceil((costMicros * marginBps) / 10_000)
  const costWithMargin = costMicros + marginMicros
  const creditValueMicros = getCreditValueMicros()
  const credits = Math.max(
    getMinScanCredits(),
    Math.ceil(costWithMargin / creditValueMicros),
  )

  return {
    credits,
    costMicros,
    marginMicros,
    method: "usage",
    breakdown,
  }
}

export function pricingResultToLedgerMetadata(
  usage: UsageInput,
  pricing: PricingResult,
): Prisma.InputJsonValue {
  return {
    modelId: usage.modelId,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    cachedTokens: usage.cachedTokens ?? 0,
    costMicros: pricing.costMicros,
    marginMicros: pricing.marginMicros,
    creditsCharged: pricing.credits,
    pricingMethod: pricing.method,
    breakdown: pricing.breakdown,
  }
}

export function formatCreditUsdValue(credits: number): string {
  const micros = credits * getCreditValueMicros()
  return `$${(micros / 1_000_000).toFixed(4)}`
}
