import { revalidatePath } from "next/cache"

import type { ScanCaptureMode } from "@/generated/prisma/client"
import { CONSENT_VERSION } from "@/lib/onboarding/constants"
import { prisma } from "@/lib/db/client"
import { withDbRetry } from "@/lib/db/retry"
import { REPORT_FORMAT_VERSION } from "@/lib/scan/constants"
import { toScanResultData } from "@/lib/scan/persist"
import type { SkinAssessment } from "@/lib/scan/types"
import {
  pricingResultToLedgerMetadata,
  type PricingResult,
} from "@/lib/tokens/pricing"
import type { UsageInput } from "@/lib/tokens/pricing"
import { debitTokensInTransaction } from "@/lib/tokens/wallet"
import { toLocationSnapshot } from "@/lib/climate/context"
import type { UserLocation } from "@/generated/prisma/client"

type PersistScanResultInput = {
  userId: string
  assessment: SkinAssessment
  usage: UsageInput
  pricing: PricingResult
  latencyMs: number
  captureMode?: ScanCaptureMode
  location: UserLocation | null
  profile: {
    ageBand: string | null
    skinType: string | null
    fitzpatrickBand: string | null
    primaryConcerns: string[]
    skinGoals: string[]
    consentVersion: string | null
    photoProcessingConsent: boolean | null
    consentAcceptedAt: Date | null
  } | null
}

export async function persistScanResult(input: PersistScanResultInput) {
  const resultData = toScanResultData(input.assessment)

  return withDbRetry(() =>
    prisma.$transaction(async (tx) => {
      const created = await tx.scan.create({
        data: {
          userId: input.userId,
          status: "completed",
          captureMode: input.captureMode ?? "still",
          imageRetained: false,
          profileSnapshot: input.profile
            ? {
                ageBand: input.profile.ageBand,
                skinType: input.profile.skinType,
                fitzpatrickBand: input.profile.fitzpatrickBand,
                primaryConcerns: input.profile.primaryConcerns,
                skinGoals: input.profile.skinGoals,
              }
            : undefined,
          locationSnapshot: input.location
            ? toLocationSnapshot(input.location)
            : undefined,
          consentSnapshot: input.profile
            ? {
                consentVersion: input.profile.consentVersion ?? CONSENT_VERSION,
                photoProcessingConsent: input.profile.photoProcessingConsent,
                consentAcceptedAt: input.profile.consentAcceptedAt,
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
          naturalRecommendations: resultData.naturalRecommendations,
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

      const totalTokens =
        input.usage.inputTokens +
        input.usage.outputTokens +
        (input.usage.cachedTokens ?? 0)

      if (totalTokens > 0) {
        await tx.scanUsage.create({
          data: {
            scanId: created.id,
            provider: input.usage.provider,
            modelId: input.usage.modelId,
            inputTokens: input.usage.inputTokens,
            outputTokens: input.usage.outputTokens,
            cachedTokens: input.usage.cachedTokens ?? 0,
            totalTokens,
            estimatedCostMicros: input.pricing.costMicros,
            latencyMs: input.latencyMs,
          },
        })
      }

      await debitTokensInTransaction(tx, {
        userId: input.userId,
        amount: input.pricing.credits,
        reason: "scan_debit",
        scanId: created.id,
        provider: input.usage.provider,
        metadata: pricingResultToLedgerMetadata(input.usage, input.pricing),
      })

      return { scan: created, report }
    }),
  ).then((saved) => {
    revalidatePath("/reports")
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/usage")
    return saved
  })
}
