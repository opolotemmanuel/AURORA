import { enrichChatProductRecommendations } from "@/lib/products/enrich-recommendations"
import { filterRecommendationsByAllergies } from "@/lib/products/filter-recommendations-by-allergies"
import { prisma } from "@/lib/db/client"
import { stripDuplicateRecommendationProse } from "@/lib/chat/format-message-body"
import { splitChatDisclaimer } from "@/lib/chat/split-disclaimer"
import {
  chatRecommendationsSchema,
  extractJsonFence,
  parseChatRecommendationsJson,
  stripJsonFence,
} from "@/lib/chat/extract-recommendations"
import type { ChatMessageMetadata } from "@/lib/chat/types"
import type { NaturalRecommendation } from "@/lib/scan/types"

export type ParsedChatReply = {
  content: string
  metadata: ChatMessageMetadata | null
}

function finalizeChatReply(
  prose: string,
  metadata: ChatMessageMetadata | null,
): ParsedChatReply {
  const { body, consultationNote } = splitChatDisclaimer(prose)
  if (!consultationNote && !metadata) {
    return { content: body, metadata: null }
  }

  const nextMetadata: ChatMessageMetadata = { ...(metadata ?? {}) }
  delete nextMetadata.disclaimer
  if (consultationNote) {
    nextMetadata.consultationNote = consultationNote
  }

  const displayBody = stripDuplicateRecommendationProse(body, nextMetadata)

  return {
    content: displayBody,
    metadata: Object.keys(nextMetadata).length > 0 ? nextMetadata : null,
  }
}

export async function parseAndEnrichChatReply(
  rawReply: string,
  userId: string,
): Promise<ParsedChatReply> {
  const { prose, jsonText, tail } = extractJsonFence(rawReply)
  const combinedProse = [prose, tail].filter(Boolean).join("\n\n")

  if (!jsonText) {
    return finalizeChatReply(combinedProse || rawReply.trim(), null)
  }

  const parsed = parseChatRecommendationsJson(jsonText)
  if (!parsed) {
    return finalizeChatReply(
      combinedProse || stripJsonFence(rawReply.trim()),
      null,
    )
  }

  const metadata: ChatMessageMetadata = {}

  if (parsed.naturalRecommendations?.length) {
    metadata.naturalRecommendations =
      parsed.naturalRecommendations as NaturalRecommendation[]
  }

  if (parsed.productRecommendations?.length) {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { allergies: true },
    })
    const allergySafeRecommendations = await filterRecommendationsByAllergies(
      parsed.productRecommendations,
      profile?.allergies ?? null,
    )
    const enriched = await enrichChatProductRecommendations(
      allergySafeRecommendations,
    )
    if (enriched.length > 0) {
      metadata.productRecommendations = enriched
    }
  }

  if (
    !metadata.naturalRecommendations?.length &&
    !metadata.productRecommendations?.length
  ) {
    return finalizeChatReply(
      combinedProse || stripJsonFence(rawReply.trim()),
      null,
    )
  }

  return finalizeChatReply(combinedProse || prose, metadata)
}

// Re-export schema for tests or tooling
export { chatRecommendationsSchema }
