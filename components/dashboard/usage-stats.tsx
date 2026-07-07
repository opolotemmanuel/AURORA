import { RecentActivityList } from "@/components/dashboard/recent-activity-list"
import { UsageBarChart } from "@/components/dashboard/usage-chart"
import { StatCard } from "@/components/dashboard/page-header"
import { Progress } from "@/components/ui/progress"
import { requireAuthContext } from "@/lib/auth/context"
import { getUserDashboardStats } from "@/lib/dashboard/stats"

export async function UsageStats() {
  const ctx = await requireAuthContext()
  const stats = await getUserDashboardStats(ctx.userId)

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Available" value={stats.balance.toLocaleString()} />
        <StatCard label="Used" value={stats.lifetimeUsed.toLocaleString()} />
        <StatCard label="Granted" value={stats.lifetimeGranted.toLocaleString()} />
      </div>

      <div className="rounded-none border border-border bg-card p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-heading text-sm font-medium">Credits used</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {stats.lifetimeUsed.toLocaleString()} of{" "}
              {stats.lifetimeGranted.toLocaleString()} granted
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {stats.balance.toLocaleString()} available
          </p>
        </div>
        <Progress
          value={Math.min(
            100,
            (stats.lifetimeUsed / Math.max(stats.lifetimeGranted, 1)) * 100,
          )}
          className="mt-4 h-2"
        />
      </div>

      <div className="rounded-none border border-border bg-card p-5">
        <h2 className="font-heading text-sm font-medium">Daily token usage</h2>
        <div className="mt-4">
          <UsageBarChart data={stats.dailyUsage} />
        </div>
      </div>

      <div className="rounded-none border border-border bg-card p-5">
        <h2 className="font-heading text-sm font-medium">Recent activity</h2>
        <div className="mt-4">
          <RecentActivityList entries={stats.recentActivity} />
        </div>
      </div>
    </>
  )
}
