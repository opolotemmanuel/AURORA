// Persistence for one user's self-declared allergy list. Every read/write
// here is scoped by a `userId` the caller must supply — same ownership
// pattern as lib/dosha/dosha-store.ts and lib/backend/report-store.ts's
// listReportsForUser, never a global/unscoped query.
import { prisma } from "@/lib/db"

export async function getUserAllergies(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { allergies: true },
  })

  return user?.allergies ?? null
}

// Trims to null (not empty string) so an emptied-out field reads back as
// "no declared allergies" everywhere else in the app — matches
// filterProductsByAllergies's `!allergies?.trim()` no-op check.
export async function saveUserAllergies(userId: string, allergies: string | null): Promise<void> {
  const trimmed = allergies?.trim() || null

  await prisma.user.update({
    where: { id: userId },
    data: { allergies: trimmed },
  })
}
