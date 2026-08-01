// The only place in app-runtime code that reads the Ingredient table
// directly. Loads the full (small — 13 rows today) controlled vocabulary
// once and hands back plain IngredientRecord[]/-with-id objects; everything
// that needs to recognize or validate an ingredient name (parse-inci.ts,
// lib/backend/product-service.ts's admin write path) takes this as a plain
// parameter rather than importing Prisma itself, so that logic stays pure
// and DB-independent (see parse-inci.ts).
//
// Wrapped in React's cache() (already used by lib/auth/resolve-session.ts)
// so multiple calls within one request/render pass share a single query
// instead of each re-fetching the same 13 rows.
import { cache } from "react"

import { prisma } from "@/lib/db"
import { SKIN_CONCERNS, type SkinConcern } from "@/lib/recommendations/types"

import type { IngredientRecord } from "./types"

function isSkinConcern(value: string): value is SkinConcern {
  return (SKIN_CONCERNS as readonly string[]).includes(value)
}

export const getIngredientVocabulary = cache(async (): Promise<Array<IngredientRecord & { id: string }>> => {
  const rows = await prisma.ingredient.findMany()

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    aliases: row.aliases,
    description: row.description,
    concerns: row.concerns.filter(isSkinConcern),
  }))
})
