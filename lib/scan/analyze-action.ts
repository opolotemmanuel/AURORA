"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { analyzeSkin } from "@/lib/ai/adapter"
import {
  ensureClimateForScan,
  toLocationSnapshot,
  toScanClimateContext,
} from "@/lib/climate/context"
import { CONSENT_VERSION } from "@/lib/onboarding/constants"
import { requireSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"
import { withDbRetry } from "@/lib/db/retry"
import { getActiveScanModel } from "@/lib/models/queries"
import { parseScanImageBase64 } from "@/lib/scan/image-bytes"
import { REPORT_FORMAT_VERSION } from "@/lib/scan/constants"
import { toScanResultData } from "@/lib/scan/persist"
import type { ScanClimateContext, SkinAssessment } from "@/lib/scan/types"
import { getMinScanCredits } from "@/lib/scan/constants"
import {
  computeScanCreditCost,
  pricingResultToLedgerMetadata,
} from "@/lib/tokens/pricing"
import { debitTokensInTransaction, getBalance } from "@/lib/tokens/wallet"

const analyzeScanInputSchema = z.object({
  imageBase64: z.string().min(1),
  imageMimeType: z
    .enum(["image/jpeg", "image/png", "image/webp"])
    .default("image/jpeg"),
})

export type AnalyzeScanResult =
  | {
      ok: true
      assessment: SkinAssessment
      scanId: string
      reportId: string
      creditsCharged: number
      climateContext: ScanClimateContext | null
    }
  | { ok: false; error: string }

export async function analyzeScanAction(
  input: z.input<typeof analyzeScanInputSchema>,
): Promise<AnalyzeScanResult> {
  const session = await requireSession()
  const parsed = analyzeScanInputSchema.parse(input)
  const image = parseScanImageBase64(parsed.imageBase64, parsed.imageMimeType)

  if (!image) {
    return { ok: false, error: "Invalid scan image" }
  }

  const activeModel = await getActiveScanModel()
  if (!activeModel) {
    return { ok: false, error: "No active scan model configured" }
  }

  const balance = await getBalance(session.user.id)
  if (balance < getMinScanCredits()) {
    return { ok: false, error: "Insufficient credits" }
  }

  const location = await ensureClimateForScan(session.user.id)
  const climateContext = toScanClimateContext(location)

  let analysis
  try {
    analysis = await analyzeSkin({
      userId: session.user.id,
      image: image.buffer,
      mimeType: image.mimeType,
      model: {
        provider: activeModel.provider,
        modelId: activeModel.modelId,
        displayName: activeModel.displayName,
      },
    })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Skin analysis failed"
    return { ok: false, error: message }
  }

  const pricing = await computeScanCreditCost(analysis.usage)
  if (balance < pricing.credits) {
    return { ok: false, error: "Insufficient credits" }
  }

  const resultData = toScanResultData(analysis.assessment)

  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
  })

  try {
    const saved = await withDbRetry(() =>
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
          analysis.usage.inputTokens +
          analysis.usage.outputTokens +
          (analysis.usage.cachedTokens ?? 0)

        if (totalTokens > 0) {
          await tx.scanUsage.create({
            data: {
              scanId: created.id,
              provider: analysis.usage.provider,
              modelId: analysis.usage.modelId,
              inputTokens: analysis.usage.inputTokens,
              outputTokens: analysis.usage.outputTokens,
              cachedTokens: analysis.usage.cachedTokens ?? 0,
              totalTokens,
              estimatedCostMicros: pricing.costMicros,
              latencyMs: analysis.latencyMs,
            },
          })
        }

        await debitTokensInTransaction(tx, {
          userId: session.user.id,
          amount: pricing.credits,
          reason: "scan_debit",
          scanId: created.id,
          provider: analysis.usage.provider,
          metadata: pricingResultToLedgerMetadata(analysis.usage, pricing),
        })

        return { scan: created, report }
      }),
    )

    revalidatePath("/reports")
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/usage")

    return {
      ok: true,
      assessment: analysis.assessment,
      scanId: saved.scan.id,
      reportId: saved.report.id,
      creditsCharged: pricing.credits,
      climateContext,
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
