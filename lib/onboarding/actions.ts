"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

import { auth } from "@/lib/auth/server"
import { grantSignupBonusIfNeeded } from "@/lib/auth/bootstrap"
import { requireSession } from "@/lib/auth/session"
import { fetchClimateSnapshot, shouldSyncClimate } from "@/lib/climate/sync"
import { prisma } from "@/lib/db/client"
import { withDbRetry } from "@/lib/db/retry"
import { reverseGeocode } from "@/lib/location/reverse-geocode"
import { getOnboardingContext } from "@/lib/onboarding/context"
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

export async function getOnboardingState() {
  const context = await getOnboardingContext()
  if (!context) {
    throw new Error("Unauthorized")
  }

  return {
    step: context.step,
    profile: context.profile,
    location: context.location,
    user: context.user,
  }
}

async function advanceStep(userId: string, step: OnboardingStep) {
  await withDbRetry(() =>
    prisma.userProfile.update({
      where: { userId },
      data: { onboardingStep: step },
    }),
  )
}

export async function resolveBrowserLocationAction(
  latitude: number,
  longitude: number,
) {
  await requireSession()

  const place = await reverseGeocode(latitude, longitude)
  if (!place) {
    return {
      ok: false as const,
      error:
        "Could not resolve your location. Enter your city and country manually.",
    }
  }

  return {
    ok: true as const,
    data: {
      city: place.city,
      region: place.region,
      country: place.country,
      latitude,
      longitude,
      locationSource: "geocode" as const,
    },
  }
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

}

export async function saveSkinAction(input: unknown) {
  const session = await requireSession()
  const data = skinSchema.parse(input)

  await prisma.userProfile.update({
    where: { userId: session.user.id },
    data: {
      skinType: data.skinType ?? null,
      fitzpatrickBand: data.fitzpatrickBand ?? null,
      primaryConcerns: data.primaryConcerns,
      skinGoals: data.skinGoals,
      allergies: data.allergies ?? null,
      expertReviewRequested: data.expertReviewRequested ?? false,
      onboardingStep: "routine",
    },
  })

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

}

export async function saveLocationAction(input: unknown) {
  const session = await requireSession()
  const parsed = locationSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid location")
  }
  const data = parsed.data

  const hasLocation =
    Boolean(data.city || data.region || data.country) ||
    (data.latitude != null && data.longitude != null)

  if (hasLocation) {
    let climate = null
    if (data.latitude != null && data.longitude != null) {
      climate = await fetchClimateSnapshot(data.latitude, data.longitude)
    }

    await prisma.userLocation.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        city: data.city ?? null,
        region: data.region ?? null,
        country: data.country ?? null,
        postalCode: data.postalCode ?? null,
        latitude: data.latitude,
        longitude: data.longitude,
        locationSource: data.locationSource,
        ...climate,
        lastSyncedAt: climate ? new Date() : undefined,
      },
      update: {
        city: data.city ?? null,
        region: data.region ?? null,
        country: data.country ?? null,
        postalCode: data.postalCode ?? null,
        latitude: data.latitude,
        longitude: data.longitude,
        locationSource: data.locationSource,
        ...climate,
        lastSyncedAt: climate ? new Date() : undefined,
      },
    })
  }

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

  await withDbRetry(() =>
    prisma.userProfile.update({
      where: { userId: session.user.id },
      data: {
        onboardingCompletedAt: new Date(),
        onboardingStep: "complete",
      },
    }),
  )

  await withDbRetry(() =>
    prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingCompleted: true },
    }),
  )

  await grantSignupBonusIfNeeded(session.user.id)
  revalidatePath("/onboarding")
  revalidatePath("/scan")
  revalidatePath("/dashboard")
}

export async function setWelcomeStepAction() {
  const session = await requireSession()
  await advanceStep(session.user.id, "consent")
}

export async function skipToOnboardingStepAction(nextStep: OnboardingStep) {
  const session = await requireSession()
  await advanceStep(session.user.id, nextStep)
}
