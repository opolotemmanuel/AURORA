"use server"

import { revalidatePath } from "next/cache"

import { requireSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"
import { deriveAgeBand } from "@/lib/onboarding/constants"
import {
  basicsSchema,
  lifestyleSchema,
  locationSchema,
  routineSchema,
  skinSchema,
} from "@/lib/onboarding/schemas"
import { fetchClimateSnapshot } from "@/lib/climate/sync"

export async function updateBasicsAction(input: unknown) {
  const session = await requireSession()
  const data = basicsSchema.parse(input)
  const dateOfBirth = new Date(data.dateOfBirth)

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: data.name },
  })

  await prisma.userProfile.update({
    where: { userId: session.user.id },
    data: {
      dateOfBirth,
      ageBand: deriveAgeBand(dateOfBirth),
      biologicalSex: data.biologicalSex,
    },
  })

  revalidatePath("/dashboard/profile")
}

export async function updateSkinAction(input: unknown) {
  const session = await requireSession()
  const data = skinSchema.parse(input)

  await prisma.userProfile.update({
    where: { userId: session.user.id },
    data: {
      skinType: data.skinType,
      fitzpatrickBand: data.fitzpatrickBand,
      primaryConcerns: data.primaryConcerns,
      skinGoals: data.skinGoals,
      allergies: data.allergies ?? null,
      expertReviewRequested: data.expertReviewRequested ?? false,
    },
  })

  revalidatePath("/dashboard/profile")
}

export async function updateRoutineAction(input: unknown) {
  const session = await requireSession()
  const data = routineSchema.parse(input)

  await prisma.userProfile.update({
    where: { userId: session.user.id },
    data: {
      currentRoutine: data.currentRoutine,
      previousPrescriptions: data.previousPrescriptions ?? [],
      medications: data.medications ?? [],
    },
  })

  revalidatePath("/dashboard/profile")
}

export async function updateLifestyleAction(input: unknown) {
  const session = await requireSession()
  const data = lifestyleSchema.parse(input)

  await prisma.userProfile.update({
    where: { userId: session.user.id },
    data: { lifestyleFactors: data.lifestyleFactors },
  })

  revalidatePath("/dashboard/profile")
}

export async function updateLocationAction(input: unknown) {
  const session = await requireSession()
  const data = locationSchema.parse(input)

  let climate = null
  if (data.latitude != null && data.longitude != null) {
    climate = await fetchClimateSnapshot(data.latitude, data.longitude)
  }

  await prisma.userLocation.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      city: data.city,
      region: data.region,
      country: data.country,
      postalCode: data.postalCode,
      latitude: data.latitude,
      longitude: data.longitude,
      locationSource: data.locationSource,
      ...climate,
      lastSyncedAt: climate ? new Date() : undefined,
    },
    update: {
      city: data.city,
      region: data.region,
      country: data.country,
      postalCode: data.postalCode,
      latitude: data.latitude,
      longitude: data.longitude,
      locationSource: data.locationSource,
      ...climate,
      lastSyncedAt: climate ? new Date() : undefined,
    },
  })

  revalidatePath("/dashboard/profile")
}
