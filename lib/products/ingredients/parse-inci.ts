// Recognizes known ingredients inside raw text — a lookup/matching
// operation against a controlled vocabulary, never open-ended guessing. If a
// real ingredient needs to be recognized and isn't yet, it gets added to the
// vocabulary (the Ingredient table's seed data), not inferred here.
//
// One implementation handles both "clean" comma-separated ingredient lists
// and unstructured prose product descriptions: a word-boundary regex scan
// finds a vocabulary term wherever it appears in the text, and commas/
// periods/etc. are non-word characters that already satisfy a word
// boundary — so "Niacinamide, Aqua, Glycerin" and "Enriched with
// Niacinamide for an even tone" both just work without special-casing the
// input format.
import type { IngredientRecord } from "./types.ts"

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// Word-boundary-aware so a short name never matches inside a longer,
// unrelated word — e.g. \bRose\b matches "Rose water" but not "Roseville"
// or "Primrose" (no \w/non-\w boundary exists at either edge in those
// cases). Case-insensitive; doesn't affect boundary detection.
function findEarliestMatchIndex(text: string, term: string): number | null {
  const pattern = new RegExp(`\\b${escapeRegExp(term)}\\b`, "i")
  const match = pattern.exec(text)
  return match ? match.index : null
}

// Returns the canonical names of every vocabulary ingredient recognized in
// `text`, in order of first appearance, deduped (an ingredient matched via
// two different aliases still only appears once). Returns [] for
// null/undefined/empty text or when nothing in the vocabulary is present —
// never fabricates a match.
export function parseIngredientsFromText(text: string | null | undefined, vocabulary: IngredientRecord[]): string[] {
  if (!text?.trim()) return []

  const matches: Array<{ canonicalName: string; index: number }> = []

  for (const ingredient of vocabulary) {
    const candidates = [ingredient.name, ...ingredient.aliases]
    let earliestIndex: number | null = null

    for (const candidate of candidates) {
      const index = findEarliestMatchIndex(text, candidate)
      if (index !== null && (earliestIndex === null || index < earliestIndex)) {
        earliestIndex = index
      }
    }

    if (earliestIndex !== null) {
      matches.push({ canonicalName: ingredient.name, index: earliestIndex })
    }
  }

  return matches.sort((a, b) => a.index - b.index).map((match) => match.canonicalName)
}

// Resolves a single raw name/alias to its canonical Ingredient record —
// exact (trimmed, case-insensitive) match only, no substring/fuzzy
// matching. Used by the admin write path to validate a manually-typed
// ingredient name against the same controlled vocabulary the parser uses.
export function findIngredientByNameOrAlias(
  rawName: string,
  vocabulary: IngredientRecord[],
): IngredientRecord | null {
  const normalized = rawName.trim().toLowerCase()
  if (!normalized) return null

  return (
    vocabulary.find(
      (ingredient) =>
        ingredient.name.toLowerCase() === normalized ||
        ingredient.aliases.some((alias) => alias.toLowerCase() === normalized),
    ) ?? null
  )
}
