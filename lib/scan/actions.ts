"use server"

import { revalidatePath } from "next/cache"

import { CONSENT_VERSION } from "@/lib/onboarding/constants"
import { requireSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"
import { withDbRetry } from "@/lib/db/retry"
import {
  getScanTokenCost,
  REPORT_FORMAT_VERSION,
} from "@/lib/scan/constants"
import { toScanResultData } from "@/lib/scan/persist"
import { parseScanImageBase64 } from "@/lib/scan/image-bytes"
import { saveScanResultSchema } from "@/lib/scan/schemas"
import type { SkinAssessment } from "@/lib/scan/types"
import { debitTokens } from "@/lib/tokens/wallet"
import type { z } from "zod"

type SaveScanResultInput = z.input<typeof saveScanResultSchema> | SkinAssessment

type SaveScanResult =
  | { ok: true; scanId: string; reportId: string }
  | { ok: false; error: string }

export async function saveScanResultAction(
  input: SaveScanResultInput,
): Promise<SaveScanResult> {
  const session = await requireSession()
  const parsed = saveScanResultSchema.parse(
    typeof input === "object" && input !== null && "assessment" in input
      ? input
      : { assessment: input },
  )
  const assessment = parsed.assessment
  const image = parseScanImageBase64(parsed.imageBase64, parsed.imageMimeType)
  const resultData = toScanResultData(assessment)
  const tokenCost = getScanTokenCost()

  const [profile, location] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId: session.user.id } }),
    prisma.userLocation.findUnique({ where: { userId: session.user.id } }),
  ])

  try {
    const scan = await withDbRetry(() =>
      prisma.$transaction(async (tx) => {
        const created = await tx.scan.create({
          data: {
            userId: session.user.id,
            status: "completed",
            imageRetained: image !== null,
            imageMimeType: image?.mimeType,
            imageData: image ? Uint8Array.from(image.buffer) : undefined,
            profileSnapshot: profile
              ? {
                  ageBand: profile.ageBand,
                  skinType: profile.skinType,
                  fitzpatrickBand: profile.fitzpatrickBand,
                  primaryConcerns: profile.primaryConcerns,
                  skinGoals: profile.skinGoals,
                }
              : undefined,
            locationSnapshot: location
              ? {
                  city: location.city,
                  region: location.region,
                  country: location.country,
                  uvIndexBand: location.uvIndexBand,
                  humidityBand: location.humidityBand,
                }
              : undefined,
            consentSnapshot: profile
              ? {
                  consentVersion: profile.consentVersion ?? CONSENT_VERSION,
                  photoProcessingConsent: profile.photoProcessingConsent,
                  consentAcceptedAt: profile.consentAcceptedAt,
                }
              : undefined,
          },
        })

        await tx.scanResult.create({
          data: {
            scanId: created.id,
            overallBand: resultData.overallBand,
            dimensions: resultData.dimensions,
            summary: resultData.summary,
            recommendations: resultData.recommendations,
            disclaimerVersion: resultData.disclaimerVersion,
            reportFormatVersion: REPORT_FORMAT_VERSION,
          },
        })

        const report = await tx.report.create({
          data: {
            scanId: created.id,
            format: "pdf",
          },
        })

        return { scan: created, report }
      }),
    )

    try {
      await debitTokens({
        userId: session.user.id,
        amount: tokenCost,
        reason: "scan_debit",
        scanId: scan.scan.id,
        provider: "gemini",
      })
    } catch {
      // Scan is saved; token debit can fail if balance is low
    }

    revalidatePath("/reports")
    revalidatePath("/dashboard")

    return {
      ok: true,
      scanId: scan.scan.id,
      reportId: scan.report.id,
    }
  } catch {
    return { ok: false, error: "Could not save scan result" }
  }
}
