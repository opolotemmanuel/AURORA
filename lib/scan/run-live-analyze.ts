import { analyzeSkin } from "@/lib/ai/adapter"
import {
  ensureClimateForScan,
  toScanClimateContext,
} from "@/lib/climate/context"
import { prisma } from "@/lib/db/client"
import { getScanModelForTier, getUserScanTier } from "@/lib/models/queries"
import { enrichRecommendationsWithImages } from "@/lib/products/enrich-recommendations"
import { requireProScanTier, ScanAccessError } from "@/lib/scan/access"
import {
  logScanAnalysisError,
  toUserFacingScanError,
} from "@/lib/scan/errors"
import { persistScanResult } from "@/lib/scan/persist-scan-result"
import type { AnalyzeScanResult } from "@/lib/scan/types"
import { getScansRemaining } from "@/lib/scans/balance"
import { estimateScanProviderCost } from "@/lib/scans/cost"

type RunLiveAnalyzeScanInput = {
  userId: string
  image: Buffer
  mimeType: "image/jpeg" | "image/png" | "image/webp"
  transcript: string
  sessionDurationMs: number
}

export async function runLiveAnalyzeScan(
  input: RunLiveAnalyzeScanInput,
): Promise<AnalyzeScanResult> {
  try {
    await requireProScanTier(input.userId)
  } catch (err) {
    const message =
      err instanceof ScanAccessError
        ? err.message
        : "Live scan is available on the Pro tier only."
    return { ok: false, error: message }
  }

  const tier = await getUserScanTier(input.userId)
  const activeModel = await getScanModelForTier(tier)
  if (!activeModel) {
    return {
      ok: false,
      error: toUserFacingScanError(new Error("No active scan model configured")),
    }
  }

  const remaining = await getScansRemaining(input.userId)
  if (remaining < 1) {
    return {
      ok: false,
      error: toUserFacingScanError(new Error("No scans remaining")),
    }
  }

  const location = await ensureClimateForScan(input.userId)
  const climateContext = toScanClimateContext(location)

  let analysis
  try {
    analysis = await analyzeSkin({
      userId: input.userId,
      image: input.image,
      mimeType: input.mimeType,
      liveTranscript: input.transcript,
      model: {
        provider: activeModel.provider,
        modelId: activeModel.modelId,
        displayName: activeModel.displayName,
        thinkingLevel: activeModel.thinkingLevel ?? "medium",
      },
    })
  } catch (err) {
    logScanAnalysisError("live-analysis", err)
    return { ok: false, error: toUserFacingScanError(err) }
  }

  const costEstimate = await estimateScanProviderCost(analysis.usage)

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
      estimatedCostMicros: costEstimate?.costMicros ?? null,
      latencyMs: analysis.latencyMs + input.sessionDurationMs,
      captureMode: "live",
      location,
      profile,
    })

    return {
      ok: true,
      assessment: enrichedAssessment,
      scanId: saved.scan.id,
      reportId: saved.report.id,
      scansDebited: 1,
      climateContext,
    }
  } catch (err) {
    if (
      err instanceof Error &&
      err.message === "Insufficient scan balance"
    ) {
      return {
        ok: false,
        error: toUserFacingScanError(new Error("No scans remaining")),
      }
    }
    logScanAnalysisError("live-persist", err)
    return {
      ok: false,
      error: toUserFacingScanError(new Error("Could not save scan result")),
    }
  }
}
