// Persistence for one user's dosha questionnaire result. Every read/write
// here is scoped by a `userId` the caller must supply — same ownership
// pattern as lib/backend/report-store.ts's listReportsForUser, never a
// global/unscoped query.
import { prisma } from "@/lib/db"
import type { Dosha } from "./questions"
import type { DoshaResult } from "./scoring"

export type StoredDoshaProfile = {
  userId: string
  primaryDosha: Dosha
  secondaryDosha: Dosha | null
  breakdown: Record<Dosha, number>
  createdAt: string
  updatedAt: string
}

export async function getDoshaProfile(userId: string): Promise<StoredDoshaProfile | null> {
  const profile = await prisma.doshaProfile.findUnique({ where: { userId } })
  return profile ? mapProfile(profile) : null
}

// Upsert, not create — retaking the questionnaire updates the existing row
// (one profile per user, enforced by DoshaProfile.userId's @unique
// constraint) rather than accumulating duplicates.
export async function saveDoshaProfile(userId: string, result: DoshaResult): Promise<StoredDoshaProfile> {
  const data = {
    primaryDosha: toPrismaDosha(result.primary),
    secondaryDosha: result.secondary ? toPrismaDosha(result.secondary) : null,
    breakdown: result.breakdown,
  }

  const profile = await prisma.doshaProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  })

  return mapProfile(profile)
}

function mapProfile(profile: {
  userId: string
  primaryDosha: string
  secondaryDosha: string | null
  breakdown: unknown
  createdAt: Date
  updatedAt: Date
}): StoredDoshaProfile {
  return {
    userId: profile.userId,
    primaryDosha: fromPrismaDosha(profile.primaryDosha),
    secondaryDosha: profile.secondaryDosha ? fromPrismaDosha(profile.secondaryDosha) : null,
    breakdown: (profile.breakdown as Record<Dosha, number> | null) ?? { vata: 0, pitta: 0, kapha: 0 },
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  }
}

function toPrismaDosha(dosha: Dosha) {
  return dosha.toUpperCase() as "VATA" | "PITTA" | "KAPHA"
}

function fromPrismaDosha(dosha: string): Dosha {
  return dosha.toLowerCase() as Dosha
}
