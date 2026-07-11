import { getCatalogContext } from "@/lib/ai/context/catalog"
import { getUserScanHistoryContext } from "@/lib/ai/context/scan-history"
import { getUserScanContext } from "@/lib/ai/context/user"
import { enrichProductLinks } from "@/lib/ai/enrich-product-links"
import {
  runFullInputGuardrails,
  sanitizeAssistantOutput,
} from "@/lib/ai/guardrails"
import {
  buildAdviceContextText,
  buildAdviceSystemPrompt,
  buildFollowUpContextText,
  buildFollowUpSystemPrompt,
} from "@/lib/ai/prompts/chat"
import { analyzeWithGemini } from "@/lib/ai/providers/gemini"
import { generateChatReply } from "@/lib/ai/providers/gemini-chat"
import {
  transcribeWithGemini,
  type TranscribeAudioInput,
  type TranscribeAudioResult,
} from "@/lib/ai/providers/gemini-transcribe"
import type { AnalyzeSkinInput, AnalyzeSkinResult } from "@/lib/ai/types"
import {
  mapUserClimateToTags,
  rankCatalogByClimateTags,
} from "@/lib/climate/tag-match"
import { parseLocationSnapshot } from "@/lib/climate/snapshot"
import { prisma } from "@/lib/db/client"
import { getScanModelForTier, getUserScanTier } from "@/lib/models/queries"
import { fromScanResult } from "@/lib/scan/persist"
import { hasSufficientTokenBudget } from "@/lib/chat/token-budget"
import type { ChatHistoryMessage } from "@/lib/ai/providers/gemini-chat"
import type { ChatConversationKind } from "@/generated/prisma/client"

export async function analyzeSkin(
  input: Omit<AnalyzeSkinInput, "catalog" | "userContext">,
): Promise<AnalyzeSkinResult> {
  const [catalog, userContext] = await Promise.all([
    getCatalogContext(),
    getUserScanContext(input.userId),
  ])

  if (catalog.length === 0) {
    throw new Error("No active products in catalog")
  }

  const activeClimateTags = mapUserClimateToTags(userContext.location)
  const rankedCatalog = rankCatalogByClimateTags(catalog, activeClimateTags)

  if (input.model.provider !== "gemini") {
    throw new Error(`Provider ${input.model.provider} is not supported yet`)
  }

  return analyzeWithGemini({
    ...input,
    catalog: rankedCatalog,
    userContext,
    activeClimateTags,
  })
}

export async function transcribeSpeech(
  input: TranscribeAudioInput,
): Promise<TranscribeAudioResult> {
  return transcribeWithGemini(input)
}

export type ChatAboutSkinInput = {
  userId: string
  kind: ChatConversationKind
  userMessage: string
  history: ChatHistoryMessage[]
  scanId?: string
  image?: {
    mimeType: "image/jpeg" | "image/png" | "image/webp"
    data: Buffer
  }
}

export type ChatAboutSkinResult =
  | {
      allowed: true
      reply: string
      usage: AnalyzeSkinResult["usage"]
      latencyMs: number
    }
  | { allowed: false; reason: string }

export async function chatAboutSkin(
  input: ChatAboutSkinInput,
): Promise<ChatAboutSkinResult> {
  const tier = await getUserScanTier(input.userId)
  const model = await getScanModelForTier(tier)
  if (!model) {
    throw new Error("No active chat model configured")
  }

  const hasScanContext = input.kind === "follow_up" && Boolean(input.scanId)

  const hasImage = Boolean(input.image?.data.byteLength)

  const guardrails = await runFullInputGuardrails(
    input.userMessage,
    model.modelId,
    hasScanContext,
    { hasImage, history: input.history },
  )
  if (!guardrails.allowed) {
    return { allowed: false, reason: guardrails.reason }
  }

  const hasBudget = await hasSufficientTokenBudget(input.userId)
  if (!hasBudget) {
    return { allowed: false, reason: "Insufficient chat token budget" }
  }

  const [catalog, userContext, scanHistory] = await Promise.all([
    getCatalogContext(),
    getUserScanContext(input.userId),
    getUserScanHistoryContext(input.userId, {
      excludeScanId:
        input.kind === "follow_up" && input.scanId ? input.scanId : undefined,
    }),
  ])

  const activeClimateTags = mapUserClimateToTags(userContext.location)
  const rankedCatalog = rankCatalogByClimateTags(catalog, activeClimateTags)

  let systemInstruction: string
  let contextPrefix: string

  if (input.kind === "follow_up" && input.scanId) {
    const scan = await prisma.scan.findFirst({
      where: { id: input.scanId, userId: input.userId },
      include: { result: true },
    })
    if (!scan?.result) {
      return { allowed: false, reason: "Scan not found" }
    }
    const assessment = fromScanResult(scan.result)
    const climateContext = parseLocationSnapshot(scan.locationSnapshot)
    systemInstruction = buildFollowUpSystemPrompt()
    contextPrefix = buildFollowUpContextText(
      userContext,
      rankedCatalog,
      assessment,
      climateContext,
      scanHistory,
      activeClimateTags,
    )
  } else {
    systemInstruction = buildAdviceSystemPrompt(scanHistory.length > 0)
    contextPrefix = buildAdviceContextText(
      userContext,
      rankedCatalog,
      scanHistory,
      activeClimateTags,
    )
  }

  const fullSystem = `${systemInstruction}\n\nContext:\n${contextPrefix}`

  const { text, usage, latencyMs } = await generateChatReply({
    modelId: model.modelId,
    systemInstruction: fullSystem,
    history: input.history,
    userMessage: input.userMessage,
    userImage: input.image,
  })

  const reply = enrichProductLinks(
    sanitizeAssistantOutput(text),
    rankedCatalog,
  )

  return {
    allowed: true,
    reply,
    usage: {
      provider: model.provider,
      modelId: model.modelId,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      cachedTokens: usage.cachedTokens,
      reasoningTokens: usage.reasoningTokens,
      totalTokens: usage.totalTokens,
      rawUsage: usage.rawUsage,
    },
    latencyMs,
  }
}
