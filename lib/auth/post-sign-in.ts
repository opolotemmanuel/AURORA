"use server"

import { ensureUserRecords } from "@/lib/auth/bootstrap"

export async function ensureUserRecordsAction(
  userId: string,
  email: string,
  name?: string | null
) {
  await ensureUserRecords(userId, email, name ?? undefined)
}
