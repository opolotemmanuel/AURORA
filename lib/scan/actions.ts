"use server"

import { revalidatePath } from "next/cache"

import { toLocationSnapshot } from "@/lib/climate/context"
import { requireSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"
import { withDbRetry } from "@/lib/db/retry"
import { CONSENT_VERSION } from "@/lib/onboarding/constants"
import { REPORT_FORMAT_VERSION } from "@/lib/scan/constants"
import { toScanResultData } from "@/lib/scan/persist"
import { saveScanResultSchema } from "@/lib/scan/schemas"
import type { SkinAssessment } from "@/lib/scan/types"
import { DEFAULT_MOCK_USAGE } from "@/lib/tokens/constants"
import {
  computeScanCreditCost,
  pricingResultToLedgerMetadata,
  type UsageInput,
} from "@/lib/tokens/pricing"
import { debitTokensInTransaction, getBalance } from "@/lib/tokens/wallet"
import type { z } from "zod"

type SaveScanResultInput = z.input<typeof saveScanResultSchema> | SkinAssessment

type SaveScanResult =
  | { ok: true; scanId: string; reportId: string }
  | { ok: false; error: string }

function hasMeteredUsage(usage: UsageInput): boolean {
  return (
    usage.inputTokens > 0 ||
    usage.outputTokens > 0 ||
    (usage.cachedTokens ?? 0) > 0
  )
}

/** @deprecated Prefer analyzeScanAction for new scan flow. */
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
  const resultData = toScanResultData(assessment)
  const usage: UsageInput = parsed.usage ?? DEFAULT_MOCK_USAGE

  const pricing = await computeScanCreditCost(usage)
  const balance = await getBalance(session.user.id)

  if (balance < pricing.credits) {
    return { ok: false, error: "Insufficient credits" }
  }

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
            imageRetained: false,
            profileSnapshot: profile
              ? {
                  ageBand: profile.ageBand,
                  skinType: profile.skinType,
                  fitzpatrickBand: profile.fitzpatrickBand,
                  primaryConcerns: profile.primaryConcerns,
                  skinGoals: profile.skinGoals,
                }
              : undefined,
            locationSnapshot: toLocationSnapshot(location),
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

        if (hasMeteredUsage(usage)) {
          const totalTokens =
            usage.inputTokens +
            usage.outputTokens +
            (usage.cachedTokens ?? 0)

          await tx.scanUsage.create({
            data: {
              scanId: created.id,
              provider: usage.provider,
              modelId: usage.modelId,
              inputTokens: usage.inputTokens,
              outputTokens: usage.outputTokens,
              cachedTokens: usage.cachedTokens ?? 0,
              totalTokens,
              estimatedCostMicros: pricing.costMicros,
            },
          })
        }

        await debitTokensInTransaction(tx, {
          userId: session.user.id,
          amount: pricing.credits,
          reason: "scan_debit",
          scanId: created.id,
          provider: usage.provider,
          metadata: pricingResultToLedgerMetadata(usage, pricing),
        })

        return { scan: created, report }
      }),
    )

    revalidatePath("/reports")
    revalidatePath("/dashboard")

    return {
      ok: true,
      scanId: scan.scan.id,
      reportId: scan.report.id,
    }
  } catch (err) {
    if (
      err instanceof Error &&
      err.message === "Insufficient token balance"
    ) {
      return { ok: false, error: "Insufficient credits" }
    }
    return { ok: false, error: "Could not save scan result" }
  }
}
