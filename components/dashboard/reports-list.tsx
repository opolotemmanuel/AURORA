import Link from "next/link"

import { ReportsListClient } from "@/components/reports/reports-list-client"
import type { ReportListItem } from "@/components/reports/reports-list-client"
import { Button } from "@/components/ui/button"
import { requireAuthContext } from "@/lib/auth/context"
import { prisma } from "@/lib/db/client"
import { enrichManyRecommendationsWithImages } from "@/lib/products/enrich-recommendations"
import { REPORTS_PAGE_SIZE } from "@/lib/reports/constants"
import type { ProductRecommendation } from "@/lib/scan/types"

type ScanDebitMetadata = {
  creditsCharged?: number
  modelId?: string
}

function getCreditsCharged(
  ledger: { delta: number; metadata: unknown } | undefined,
): number | null {
  if (!ledger) return null
  const metadata = ledger.metadata as ScanDebitMetadata | null
  if (metadata?.creditsCharged != null) {
    return metadata.creditsCharged
  }
  return Math.abs(ledger.delta)
}

type ReportsListProps = {
  page?: number
}

export async function ReportsList({ page = 1 }: ReportsListProps) {
  const ctx = await requireAuthContext()
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
  const skip = (safePage - 1) * REPORTS_PAGE_SIZE

  const where = { userId: ctx.userId }

  const [scans, totalCount] = await Promise.all([
    prisma.scan.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: REPORTS_PAGE_SIZE,
      include: {
        result: true,
        usage: true,
        feedback: true,
        tokenLedgers: {
          where: { reason: "scan_debit" },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.scan.count({ where }),
  ])

  const recommendationGroups = scans.map((scan) =>
    scan.result && Array.isArray(scan.result.recommendations)
      ? (scan.result.recommendations as ProductRecommendation[])
      : [],
  )
  const enrichedGroups = await enrichManyRecommendationsWithImages(
    recommendationGroups,
  )

  const serialized: ReportListItem[] = scans.map((scan, index) => {
    const ledger = scan.tokenLedgers[0]
    return {
      id: scan.id,
      createdAt: scan.createdAt.toISOString(),
      status: scan.status,
      captureMode: scan.captureMode,
      locationSnapshot: scan.locationSnapshot,
      usage: scan.usage
        ? {
            modelId: scan.usage.modelId,
            inputTokens: scan.usage.inputTokens,
            outputTokens: scan.usage.outputTokens,
            totalTokens: scan.usage.totalTokens,
            latencyMs: scan.usage.latencyMs,
            estimatedCostMicros: scan.usage.estimatedCostMicros,
          }
        : null,
      creditsCharged: getCreditsCharged(ledger),
      result: scan.result
        ? {
            overallBand: scan.result.overallBand,
            dimensions: scan.result.dimensions,
            summary: scan.result.summary,
            naturalRecommendations: scan.result.naturalRecommendations,
            recommendations: enrichedGroups[index] ?? [],
            disclaimerVersion: scan.result.disclaimerVersion,
          }
        : null,
      feedback: scan.feedback
        ? {
            rating: scan.feedback.rating,
            message: scan.feedback.message,
          }
        : null,
    }
  })

  const totalPages = Math.max(1, Math.ceil(totalCount / REPORTS_PAGE_SIZE))

  if (totalCount === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">No scans yet.</p>
        <Button asChild className="mt-4" variant="secondary">
          <Link href="/scan">Start a scan</Link>
        </Button>
      </div>
    )
  }

  return (
    <ReportsListClient
      scans={serialized}
      page={safePage}
      totalPages={totalPages}
      totalCount={totalCount}
    />
  )
}
