// Relative, extension-explicit import (not the "@/" alias) — this module is
// imported by lib/products/ingest/ingredient-vocabulary.ts, which runs
// standalone via plain `node` for scripts/sync-products.ts (see
// sync-catalog.ts's header comment for why that path can't use "@/" or rely
// on bundler resolution).
import type { SkinConcern } from "../../recommendations/types.ts"

// The minimal shape parse-inci.ts and its consumers need to recognize and
// describe an ingredient — deliberately independent of where the row
// actually lives (Prisma for app runtime, raw `pg` for the standalone
// ingestion script, or a plain array literal in tests). No `id` here on
// purpose: matching/parsing never needs it, only the write-path (connecting
// a recognized ingredient to a product) does, and that's handled separately
// by whichever loader has DB access.
export type IngredientRecord = {
  name: string
  aliases: string[]
  description: string
  concerns: SkinConcern[]
}
