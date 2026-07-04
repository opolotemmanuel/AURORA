import { DashboardPageHeader } from "@/components/dashboard/page-header"
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
        <div className="grid gap-4">
          {scans.map((scan) => (
            <article
              key={scan.id}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {scan.createdAt.toLocaleDateString()}
                  </p>
                  <h2 className="mt-1 font-heading text-lg font-medium capitalize">
                    {scan.status}
                  </h2>
                  {scan.result?.summary ? (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {scan.result.summary}
                    </p>
                  ) : null}
                </div>
                <div className="text-right text-sm">
                  <p className="text-muted-foreground">Overall</p>
                  <p className="font-medium capitalize">
                    {scan.result?.overallBand?.replace(/_/g, " ") ?? "Pending"}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
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
