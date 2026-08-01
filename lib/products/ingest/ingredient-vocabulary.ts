// Raw-pg counterpart to lib/products/ingredients/repository.ts's Prisma-
// based loader — same reasoning as woocommerce.ts/sync-catalog.ts using
// `pg` instead of Prisma Client (see sync-catalog.ts's header comment):
// scripts/sync-products.ts runs standalone via plain `node`, where the
// generated Prisma client's extensionless imports don't resolve.
//
// Returns IngredientRecord & {id} so sync-catalog.ts can both run
// parse-inci.ts's pure matching against it (needs name/aliases/concerns
// only) and INSERT ProductIngredient rows for whatever it recognizes (needs
// the real id).
import type pg from "pg"

import { SKIN_CONCERNS, type SkinConcern } from "../../recommendations/types.ts"
import type { IngredientRecord } from "../ingredients/types.ts"

type IngredientVocabularyRow = IngredientRecord & { id: string }

function isSkinConcern(value: string): value is SkinConcern {
  return (SKIN_CONCERNS as readonly string[]).includes(value)
}

export async function loadIngredientVocabulary(client: pg.Client): Promise<IngredientVocabularyRow[]> {
  const { rows } = await client.query<{
    id: string
    name: string
    aliases: string[]
    description: string
    concerns: string[]
  }>(`SELECT id, name, aliases, description, concerns FROM "Ingredient"`)

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    aliases: row.aliases,
    description: row.description,
    // Same "tolerate, don't crash" stance as the rest of this ingestion
    // pipeline — an unrecognized concern string in the DB (e.g. from manual
    // editing) is just dropped, never propagated as a bad SkinConcern value.
    concerns: row.concerns.filter(isSkinConcern),
  }))
}
