import { renderToBuffer } from "@react-pdf/renderer"

import { prisma } from "@/lib/db/client"
import { SkinReportDocument } from "@/lib/pdf/skin-report-document"
import { fromScanResult } from "@/lib/scan/persist"
import { scanImageToDataUri } from "@/lib/scan/image-bytes"

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
  const imageSrc = scanImageToDataUri(scan.imageData, scan.imageMimeType)
  const scanDate = scan.createdAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const buffer = await renderToBuffer(
    <SkinReportDocument
      assessment={assessment}
      userName={scan.user.name}
      scanDate={scanDate}
      imageSrc={imageSrc}
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
