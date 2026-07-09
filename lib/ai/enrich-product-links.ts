import type { CatalogProductContext } from "@/lib/ai/types"

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/** Wrap unlinked catalog product names with markdown purchase links. */
export function enrichProductLinks(
  text: string,
  catalog: CatalogProductContext[],
): string {
  let result = text
  const sorted = [...catalog].sort((a, b) => b.name.length - a.name.length)

  for (const product of sorted) {
    const escapedName = escapeRegExp(product.name)
    const alreadyLinked = new RegExp(`\\[${escapedName}\\]\\(`, "i").test(result)
    if (alreadyLinked) continue

    const standalone = new RegExp(`(?<!\\[)${escapedName}(?!\\]\\()`, "i")
    result = result.replace(
      standalone,
      `[${product.name}](${product.purchaseUrl})`,
    )
  }

  return result
}
