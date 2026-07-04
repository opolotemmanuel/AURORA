import type { AiProvider } from "@/generated/prisma/client"

export const DEFAULT_SCAN_MODEL = {
  provider: "gemini" as AiProvider,
  modelId: "gemini-2.5-flash",
  displayName: "Gemini 2.5 Flash",
} as const

export const DEFAULT_MOCK_USAGE = {
  provider: DEFAULT_SCAN_MODEL.provider,
  modelId: DEFAULT_SCAN_MODEL.modelId,
  inputTokens: 0,
  outputTokens: 0,
  cachedTokens: 0,
} as const
