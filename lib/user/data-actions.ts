"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth/server"
import { requireSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"

export async function deleteProfileDataAction() {
  const session = await requireSession()

  await prisma.userProfile.update({
    where: { userId: session.user.id },
    data: {
      dateOfBirth: null,
      ageBand: null,
      biologicalSex: null,
      skinType: null,
      fitzpatrickBand: null,
      primaryConcerns: [],
      skinGoals: [],
      allergies: null,
      currentRoutine: undefined,
      previousPrescriptions: undefined,
      medications: undefined,
      lifestyleFactors: undefined,
      marketingConsent: false,
      expertReviewRequested: false,
    },
  })

  revalidatePath("/dashboard/profile")
  revalidatePath("/dashboard/privacy")
}

export async function deleteLocationDataAction() {
  const session = await requireSession()

  await prisma.userLocation.update({
    where: { userId: session.user.id },
    data: {
      city: null,
      region: null,
      country: null,
      postalCode: null,
      latitude: null,
      longitude: null,
      timezone: null,
      uvIndexBand: null,
      humidityBand: null,
      temperatureBand: null,
      climateZone: null,
      seasonBand: null,
      lastSyncedAt: null,
    },
  })

  revalidatePath("/dashboard/profile")
  revalidatePath("/dashboard/privacy")
}

export async function deleteScanAction(scanId: string) {
  const session = await requireSession()

  const scan = await prisma.scan.findFirst({
    where: { id: scanId, userId: session.user.id },
  })
  if (!scan) throw new Error("Scan not found")

  await prisma.scan.delete({ where: { id: scanId } })
  revalidatePath("/reports")
  revalidatePath("/dashboard/privacy")
  revalidatePath("/dashboard/usage")
}

export async function deleteAllScansAction() {
  const session = await requireSession()
  await prisma.scan.deleteMany({ where: { userId: session.user.id } })
  revalidatePath("/reports")
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/usage")
}

export async function deleteAllPersonalDataAction() {
  const session = await requireSession()

  await prisma.$transaction([
    prisma.scan.deleteMany({ where: { userId: session.user.id } }),
    prisma.scanLedger.deleteMany({ where: { userId: session.user.id } }),
    prisma.scanBalance.update({
      where: { userId: session.user.id },
      data: { remaining: 0, lifetimeUsed: 0, lifetimeGranted: 0 },
    }),
    prisma.userProfile.update({
      where: { userId: session.user.id },
      data: {
        dateOfBirth: null,
        ageBand: null,
        biologicalSex: null,
        skinType: null,
        fitzpatrickBand: null,
        primaryConcerns: [],
        skinGoals: [],
        allergies: null,
        currentRoutine: undefined,
        previousPrescriptions: undefined,
        medications: undefined,
        lifestyleFactors: undefined,
        photoProcessingConsent: false,
        marketingConsent: false,
        consentVersion: null,
        consentAcceptedAt: null,
        expertReviewRequested: false,
      },
    }),
    prisma.userLocation.update({
      where: { userId: session.user.id },
      data: {
        city: null,
        region: null,
        country: null,
        postalCode: null,
        latitude: null,
        longitude: null,
        timezone: null,
        uvIndexBand: null,
        humidityBand: null,
        temperatureBand: null,
        climateZone: null,
        seasonBand: null,
        lastSyncedAt: null,
      },
    }),
  ])

  revalidatePath("/dashboard")
  revalidatePath("/reports")
  revalidatePath("/dashboard/privacy")
}

export async function deleteAccountAction() {
  const session = await requireSession()

  await prisma.$transaction([
    prisma.scan.deleteMany({ where: { userId: session.user.id } }),
    prisma.scanLedger.deleteMany({ where: { userId: session.user.id } }),
    prisma.scanBalance.deleteMany({ where: { userId: session.user.id } }),
    prisma.userProfile.deleteMany({ where: { userId: session.user.id } }),
    prisma.userLocation.deleteMany({ where: { userId: session.user.id } }),
  ])

  await auth.api.deleteUser({
    body: {},
    headers: await headers(),
  })

  redirect("/login")
}
