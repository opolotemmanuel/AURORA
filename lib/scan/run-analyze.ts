import { analyzeSkin } from "@/lib/ai/adapter"
import {
  ensureClimateForScan,
  toScanClimateContext,
} from "@/lib/climate/context"
import { prisma } from "@/lib/db/client"
import { getScanModelForTier, getUserScanTier } from "@/lib/models/queries"
import { enrichRecommendationsWithImages } from "@/lib/products/enrich-recommendations"
import { getMinScanCredits } from "@/lib/scan/constants"
import {
  logScanAnalysisError,
  toUserFacingScanError,
} from "@/lib/scan/errors"
import { persistScanResult } from "@/lib/scan/persist-scan-result"
import type { AnalyzeScanResult } from "@/lib/scan/types"
import { computeScanCreditCost } from "@/lib/tokens/pricing"
import { getBalance } from "@/lib/tokens/wallet"

type RunAnalyzeScanInput = {
  userId: string
  image: Buffer
  mimeType: "image/jpeg" | "image/png" | "image/webp"
}

export async function runAnalyzeScan(
  input: RunAnalyzeScanInput,
): Promise<AnalyzeScanResult> {
  const tier = await getUserScanTier(input.userId)
  const activeModel = await getScanModelForTier(tier)
  if (!activeModel) {
    return {
      ok: false,
      error: toUserFacingScanError(
        new Error(`No active scan model configured for ${tier} tier`),
      ),
    }
  }

  const balance = await getBalance(input.userId)
  if (balance < getMinScanCredits()) {
    return { ok: false, error: toUserFacingScanError(new Error("Insufficient credits")) }
  }

  const location = await ensureClimateForScan(input.userId)
  const climateContext = toScanClimateContext(location)

  let analysis
  try {
    analysis = await analyzeSkin({
      userId: input.userId,
      image: input.image,
      mimeType: input.mimeType,
      model: {
        provider: activeModel.provider,
        modelId: activeModel.modelId,
        displayName: activeModel.displayName,
        thinkingLevel: activeModel.thinkingLevel,
      },
    })
  } catch (err) {
    logScanAnalysisError("analysis", err)
    return { ok: false, error: toUserFacingScanError(err) }
  }

  const pricing = await computeScanCreditCost(analysis.usage)
  if (balance < pricing.credits) {
    return { ok: false, error: toUserFacingScanError(new Error("Insufficient credits")) }
  }

  const enrichedAssessment = {
    ...analysis.assessment,
    recommendations: await enrichRecommendationsWithImages(
      analysis.assessment.recommendations,
    ),
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId: input.userId },
  })

  try {
    const saved = await persistScanResult({
      userId: input.userId,
      assessment: enrichedAssessment,
      usage: analysis.usage,
      pricing,
      latencyMs: analysis.latencyMs,
      captureMode: "still",
      location,
      profile,
    })

    return {
      ok: true,
      assessment: enrichedAssessment,
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
      return { ok: false, error: toUserFacingScanError(new Error("Insufficient credits")) }
    }
    logScanAnalysisError("persist", err)
    return {
      ok: false,
      error: toUserFacingScanError(new Error("Could not save scan result")),
    }
  }
}
