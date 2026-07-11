import { stripJsonFence } from "@/lib/chat/extract-recommendations"
import { splitChatDisclaimer } from "@/lib/chat/split-disclaimer"
import type { ChatMessageMetadata } from "@/lib/chat/types"

const NATURAL_SECTION_HEADING =
  /^##\s*(?:Natural|Lifestyle|Everyday)(?:\s|&).*$/i

const PRODUCT_SECTION_HEADING =
  /^##\s*(?:Recommended\s+)?(?:Aurora\s+)?Products?.*$/i

type RecommendationProseOptions = Pick<
  ChatMessageMetadata,
  "naturalRecommendations" | "productRecommendations"
>

/**
 * When structured recommendation cards are shown, remove matching prose
 * sections so habits and products are not repeated in the bubble.
 */
export function stripDuplicateRecommendationProse(
  body: string,
  options?: RecommendationProseOptions | null,
): string {
  const hasNatural = (options?.naturalRecommendations?.length ?? 0) > 0
  const hasProducts = (options?.productRecommendations?.length ?? 0) > 0

  if (!body.trim() || (!hasNatural && !hasProducts)) {
    return body
  }

  const lines = body.replace(/\r\n/g, "\n").split("\n")
  const output: string[] = []
  let skipping = false

  for (const line of lines) {
    const trimmed = line.trim()
    const isNaturalHeading = hasNatural && NATURAL_SECTION_HEADING.test(trimmed)
    const isProductHeading = hasProducts && PRODUCT_SECTION_HEADING.test(trimmed)

    if (isNaturalHeading || isProductHeading) {
      skipping = true
      continue
    }

    if (skipping) {
      if (
        /^##\s+/.test(trimmed) &&
        !NATURAL_SECTION_HEADING.test(trimmed) &&
        !PRODUCT_SECTION_HEADING.test(trimmed)
      ) {
        skipping = false
        output.push(line)
      }
      continue
    }

    output.push(line)
  }

  return output
    .join("\n")
    .replace(/\n---\n+(?=##)/g, "\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

/** Strip fenced JSON, disclaimers, and duplicate recommendation prose for display. */
export function formatChatMessageBody(
  content: string,
  options?: RecommendationProseOptions | null,
): string {
  const withoutJson = stripJsonFence(content)
  const { body } = splitChatDisclaimer(withoutJson)
  return stripDuplicateRecommendationProse(body, options)
}
