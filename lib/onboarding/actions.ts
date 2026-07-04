"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

import { auth } from "@/lib/auth/server"
import { grantSignupBonusIfNeeded } from "@/lib/auth/bootstrap"
import { requireSession } from "@/lib/auth/session"
import { fetchClimateSnapshot, shouldSyncClimate } from "@/lib/climate/sync"
import { prisma } from "@/lib/db/client"
import {
  CONSENT_VERSION,
  deriveAgeBand,
  type OnboardingStep,
} from "@/lib/onboarding/constants"
import {
  basicsSchema,
  consentSchema,
  lifestyleSchema,
  locationSchema,
  passwordSchema,
  routineSchema,
  skinSchema,
} from "@/lib/onboarding/schemas"

async function getProfileForUser(userId: string) {
  return prisma.userProfile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  })
}

export async function getOnboardingState() {
  const session = await requireSession()
  const profile = await getProfileForUser(session.user.id)
  const location = await prisma.userLocation.findUnique({
    where: { userId: session.user.id },
  })

  return {
    step: profile.onboardingStep as OnboardingStep,
    profile,
    location,
    user: session.user,
  }
}

async function advanceStep(userId: string, step: OnboardingStep) {
  await prisma.userProfile.update({
    where: { userId },
    data: { onboardingStep: step },
  })
  revalidatePath("/onboarding")
}

export async function saveConsentAction(input: {
  photoProcessingConsent: boolean
  marketingConsent?: boolean
}) {
  const session = await requireSession()
  const parsed = consentSchema.parse(input)

  await prisma.userProfile.update({
    where: { userId: session.user.id },
    data: {
      photoProcessingConsent: parsed.photoProcessingConsent,
      marketingConsent: parsed.marketingConsent ?? false,
      consentVersion: CONSENT_VERSION,
      consentAcceptedAt: new Date(),
      onboardingStep: "basics",
    },
  })

  revalidatePath("/onboarding")
}

export async function saveBasicsAction(input: unknown) {
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
      onboardingStep: "skin",
    },
  })

  revalidatePath("/onboarding")
}

export async function saveSkinAction(input: unknown) {
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
      onboardingStep: "routine",
    },
  })

  revalidatePath("/onboarding")
}

export async function saveRoutineAction(input: unknown) {
  const session = await requireSession()
  const data = routineSchema.parse(input)

  await prisma.userProfile.update({
    where: { userId: session.user.id },
    data: {
      currentRoutine: data.currentRoutine,
      previousPrescriptions: data.previousPrescriptions ?? [],
      medications: data.medications ?? [],
      onboardingStep: "lifestyle",
    },
  })

  revalidatePath("/onboarding")
}

export async function saveLifestyleAction(input: unknown) {
  const session = await requireSession()
  const data = lifestyleSchema.parse(input)

  await prisma.userProfile.update({
    where: { userId: session.user.id },
    data: {
      lifestyleFactors: data.lifestyleFactors,
      onboardingStep: "location",
    },
  })

  revalidatePath("/onboarding")
}

export async function saveLocationAction(input: unknown) {
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

  await advanceStep(session.user.id, "password")
}

export async function syncUserClimateAction() {
  const session = await requireSession()
  const location = await prisma.userLocation.findUnique({
    where: { userId: session.user.id },
  })

  if (!location?.latitude || !location.longitude) {
    throw new Error("Location coordinates are required")
  }

  if (!shouldSyncClimate(location.lastSyncedAt)) {
    return location
  }

  const climate = await fetchClimateSnapshot(location.latitude, location.longitude)
  return prisma.userLocation.update({
    where: { userId: session.user.id },
    data: { ...climate, lastSyncedAt: new Date() },
  })
}

export async function savePasswordAction(input: unknown) {
  const session = await requireSession()
  const data = passwordSchema.parse(input)

  await auth.api.setPassword({
    body: { newPassword: data.password },
    headers: await headers(),
  })

  await advanceStep(session.user.id, "complete")
}

export async function skipPasswordAction() {
  const session = await requireSession()
  await advanceStep(session.user.id, "complete")
}

export async function completeOnboardingAction() {
  const session = await requireSession()

  await prisma.userProfile.update({
    where: { userId: session.user.id },
    data: {
      onboardingCompletedAt: new Date(),
      onboardingStep: "complete",
    },
  })

  await prisma.user.update({
    where: { id: session.user.id },
    data: { onboardingCompleted: true },
  })

  await grantSignupBonusIfNeeded(session.user.id)
  revalidatePath("/onboarding")
  revalidatePath("/dashboard")
}

export async function setWelcomeStepAction() {
  const session = await requireSession()
  await advanceStep(session.user.id, "consent")
}
