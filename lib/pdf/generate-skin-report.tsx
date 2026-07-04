import { renderToBuffer } from "@react-pdf/renderer"

import { prisma } from "@/lib/db/client"
import { parseLocationSnapshot } from "@/lib/climate/context"
import { SkinReportDocument } from "@/lib/pdf/skin-report-document"
import { fromScanResult } from "@/lib/scan/persist"

export async function generateSkinReportPdf(scanId: string, userId: string) {
  const scan = await prisma.scan.findFirst({
    where: { id: scanId, userId },
    include: {
      result: true,
      user: { select: { name: true } },
      report: true,
    },
  })

  if (!scan?.result) {
    return null
  }

  const assessment = fromScanResult(scan.result)
  const climateContext = parseLocationSnapshot(scan.locationSnapshot)
  const scanDate = scan.createdAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const buffer = await renderToBuffer(
    <SkinReportDocument
      assessment={assessment}
      climateContext={climateContext}
      userName={scan.user.name}
      scanDate={scanDate}
    />,
  )

  if (scan.report && !scan.report.generatedAt) {
    await prisma.report.update({
      where: { id: scan.report.id },
      data: { generatedAt: new Date() },
    })
  }

  return buffer
}
