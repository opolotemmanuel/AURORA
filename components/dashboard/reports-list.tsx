import Link from "next/link"

import { ReportsListClient } from "@/components/reports/reports-list-client"
import { Button } from "@/components/ui/button"
import { requireAuthContext } from "@/lib/auth/context"
import { prisma } from "@/lib/db/client"

export async function ReportsList() {
  const ctx = await requireAuthContext()
  const scans = await prisma.scan.findMany({
    where: { userId: ctx.userId },
    orderBy: { createdAt: "desc" },
    include: { result: true },
  })

  const serialized = scans.map((scan) => ({
    id: scan.id,
    createdAt: scan.createdAt.toISOString(),
    status: scan.status,
    locationSnapshot: scan.locationSnapshot,
    result: scan.result
      ? {
          overallBand: scan.result.overallBand,
          dimensions: scan.result.dimensions,
          summary: scan.result.summary,
          recommendations: scan.result.recommendations,
          disclaimerVersion: scan.result.disclaimerVersion,
        }
      : null,
  }))

  if (scans.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">No scans yet.</p>
        <Button asChild className="mt-4" variant="secondary">
          <Link href="/scan">Start a scan</Link>
        </Button>
      </div>
    )
  }

  return <ReportsListClient scans={serialized} />
}
