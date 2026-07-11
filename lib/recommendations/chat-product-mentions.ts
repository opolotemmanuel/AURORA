// Bridges free-text chat answers (lib/ai/gemini-adapter.ts's askAboutReport/
// askSkinAdviceQuestion) back to real Product rows — a distinct concern from
// recommendation-engine.ts's scoring, so it lives in its own file rather than
// growing that one. The model is only ever asked to name a product; matching
// that name back to a real, currently-active row (never inventing one) is
// this module's whole job.
import type { AuroraProduct } from "./types"

// Must match the literal heading buildSuggestedProductsPrompt-style system
// prompt text asks the model to use — lenient about heading level/bold
// markup/trailing colon since model output formatting varies slightly turn
// to turn, but the phrase itself is fixed.
const HEADING_PATTERN = /^\s{0,3}#{0,6}\s*\**\s*suggested products\s*:?\**\s*$/i
const BULLET_PATTERN = /^\s*[-*]\s+(.*\S)\s*$/

export type SuggestedProductsResult = {
  // Chat content with the "Suggested products" heading + bullet block
  // removed — the matched products render as real cards instead, so the
  // same names shouldn't also appear twice as plain bulleted text.
  displayContent: string
  products: AuroraProduct[]
}

// Only ever returns products whose name exactly matches (case-insensitively)
// an entry in `activeProducts` — a bullet naming anything else (a model
// invention, a discontinued product, a typo) is silently dropped rather than
// shown, per the "never fabricate a product" constraint.
export function extractSuggestedProducts(
  content: string,
  activeProducts: AuroraProduct[],
): SuggestedProductsResult {
  const lines = content.split("\n")
  const headingIndex = lines.findIndex((line) => HEADING_PATTERN.test(line))

  if (headingIndex === -1) {
    return { displayContent: content, products: [] }
  }

  const byName = new Map(activeProducts.map((product) => [product.name.trim().toLowerCase(), product]))
  const matched: AuroraProduct[] = []
  const seenSlugs = new Set<string>()

  let endIndex = headingIndex + 1
  while (endIndex < lines.length) {
    const bulletMatch = BULLET_PATTERN.exec(lines[endIndex])
    if (!bulletMatch) break

    const product = byName.get(bulletMatch[1].trim().toLowerCase())
    if (product && !seenSlugs.has(product.id)) {
      matched.push(product)
      seenSlugs.add(product.id)
    }

    endIndex += 1
  }

  const displayLines = [...lines.slice(0, headingIndex), ...lines.slice(endIndex)]
  // Collapse the blank line(s) left behind where the heading block used to
  // sit, so removing it doesn't leave a visibly oversized gap in the prose.
  const displayContent = displayLines.join("\n").replace(/\n{3,}/g, "\n\n").trim()

  return { displayContent, products: matched }
}

// Compact, prompt-ready projection of the active catalog — only what the
// model needs to judge relevance (name, category, the cosmetic concerns it
// addresses). officialUrl/imagePath are deliberately left out of the prompt
// text itself: the model never needs to reproduce a link (extractSuggestedProducts
// + the API route attach the real officialUrl/imagePath after matching), so
// there's nothing for it to get wrong or hallucinate by omitting them here.
export function buildProductContextLines(products: AuroraProduct[]): string[] {
  return products.map((product) => {
    const tags = product.bestFor.join(", ") || "general routine support"
    return `- ${product.name} (${product.category}) — helps with: ${tags}`
  })
}
