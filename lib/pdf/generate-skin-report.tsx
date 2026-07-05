import { renderToBuffer } from "@react-pdf/renderer"

import { prisma } from "@/lib/db/client"
import { withDbRetry } from "@/lib/db/retry"
import { parseLocationSnapshot } from "@/lib/climate/context"
import { enrichRecommendationsWithImages } from "@/lib/products/enrich-recommendations"
import { registerReportFonts } from "@/lib/pdf/fonts"
import { getBrandLogoDataUri } from "@/lib/pdf/brand-logo"
import { resolveProductImageDataUris } from "@/lib/pdf/product-images"
import { SkinReportDocument } from "@/lib/pdf/skin-report-document"
import { fromScanResult } from "@/lib/scan/persist"

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

export async function generateSkinReportPdf(scanId: string, userId: string) {
  registerReportFonts()

  const scan = await withDbRetry(() =>
    prisma.scan.findFirst({
      where: { id: scanId, userId },
      include: {
        result: true,
        usage: true,
        user: { select: { name: true } },
        report: true,
        tokenLedgers: {
          where: { reason: "scan_debit" },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    }),
  )

  if (!scan?.result) {
    return null
  }

  const assessment = fromScanResult(scan.result)
  assessment.recommendations = await enrichRecommendationsWithImages(
    assessment.recommendations,
  )
  const climateContext = parseLocationSnapshot(scan.locationSnapshot)
  const scanDate = scan.createdAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const creditsCharged = getCreditsCharged(scan.tokenLedgers[0])
  const productImageDataUris = await resolveProductImageDataUris(
    assessment.recommendations.map((item) => item.imageUrl),
  )

  const buffer = await renderToBuffer(
    <SkinReportDocument
      assessment={assessment}
      climateContext={climateContext}
      userName={scan.user.name ?? "Aura user"}
      scanDate={scanDate}
      logoSrc={getBrandLogoDataUri()}
      captureMode={scan.captureMode}
      creditsCharged={creditsCharged}
      productImageDataUris={productImageDataUris}
      usage={
        scan.usage
          ? {
              modelId: scan.usage.modelId,
              inputTokens: scan.usage.inputTokens,
              outputTokens: scan.usage.outputTokens,
              totalTokens: scan.usage.totalTokens,
            }
          : null
      }
    />,
  )

  if (scan.report && !scan.report.generatedAt) {
    const reportId = scan.report.id
    await withDbRetry(() =>
      prisma.report.update({
        where: { id: reportId },
        data: { generatedAt: new Date() },
      }),
    )
  }

  return buffer
}
