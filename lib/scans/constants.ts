import type { AiProvider } from "@/generated/prisma/client"
import type { UsageInput } from "@/lib/scans/cost"

export const DEFAULT_SCAN_MODEL = {
  provider: "gemini" as AiProvider,
  modelId: "gemini-2.5-flash",
  displayName: "Gemini 2.5 Flash",
} as const

export const DEFAULT_MOCK_USAGE: UsageInput = {
  provider: DEFAULT_SCAN_MODEL.provider,
  modelId: DEFAULT_SCAN_MODEL.modelId,
  inputTokens: 0,
  outputTokens: 0,
  cachedTokens: 0,
}

export function getPricingMarginBps(): number {
  const raw = process.env.PRICING_MARGIN_BPS
  const parsed = raw ? Number.parseInt(raw, 10) : 2000
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 2000
}

export function getTargetMarginBps(): number {
  const raw = process.env.TARGET_MARGIN_BPS
  const parsed = raw ? Number.parseInt(raw, 10) : 7000
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 7000
}
