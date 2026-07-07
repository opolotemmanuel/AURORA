import { UsageBarChart } from "@/components/dashboard/usage-chart"
import { StatCard } from "@/components/dashboard/page-header"
import { requireAuthContext } from "@/lib/auth/context"
import { getUserDashboardStats } from "@/lib/dashboard/stats"

export async function DashboardOverviewStats() {
  const ctx = await requireAuthContext()
  const stats = await getUserDashboardStats(ctx.userId)

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Scans remaining" value={stats.remaining.toLocaleString()} />
        <StatCard
          label="Scans used"
          value={stats.lifetimeUsed.toLocaleString()}
          hint="All time"
        />
        <StatCard label="Total scans" value={stats.scanCount} />
        <StatCard
          label="Skin type"
          value={String(stats.profile?.skinType ?? "—")}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-none border border-border bg-card p-5">
          <h2 className="font-heading text-sm font-medium">Scans used (14 days)</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            One scan debited per saved analysis
          </p>
          <div className="mt-4">
            <UsageBarChart data={stats.dailyUsage} />
          </div>
        </div>

        <div className="rounded-none border border-border bg-card p-5">
          <h2 className="font-heading text-sm font-medium">Quick summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Location</dt>
              <dd>
                {stats.location?.city
                  ? `${stats.location.city}, ${stats.location.region}`
                  : "Not set"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Climate zone</dt>
              <dd>{stats.location?.climateZone ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Primary concerns</dt>
              <dd className="text-right capitalize">
                {stats.profile?.primaryConcerns?.slice(0, 3).join(", ") || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Scans granted</dt>
              <dd>{stats.lifetimeGranted.toLocaleString()}</dd>
            </div>
          </dl>
        </div>
      </div>
    </>
  )
}
