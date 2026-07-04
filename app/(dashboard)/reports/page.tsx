import { DashboardPageHeader } from "@/components/dashboard/page-header"
import { ReportsListClient } from "@/components/reports/reports-list-client"
import { Button } from "@/components/ui/button"
import { requireSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"
import Link from "next/link"

export default async function ReportsPage() {
  const session = await requireSession()
  const scans = await prisma.scan.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { result: true },
  })

  const serialized = scans.map((scan) => ({
    id: scan.id,
    createdAt: scan.createdAt.toISOString(),
    status: scan.status,
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

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Reports"
        description="Your scan history and cosmetic assessment results."
      />

      {scans.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">No scans yet.</p>
          <Button asChild className="mt-4" variant="secondary">
            <Link href="/scan">Start a scan</Link>
          </Button>
        </div>
      ) : (
        <ReportsListClient scans={serialized} />
      )}

      <p className="text-xs text-muted-foreground">
        Delete individual scans from{" "}
        <Link href="/dashboard/privacy" className="underline underline-offset-4">
          Privacy
        </Link>
        .
      </p>
    </div>
  )
}
