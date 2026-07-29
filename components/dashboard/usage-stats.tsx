import { RecentActivityList } from "@/components/dashboard/recent-activity-list"
import { UsageBarChart } from "@/components/dashboard/usage-chart"
import { UsageScanSummary } from "@/components/dashboard/usage-scan-summary"
import { StatCard } from "@/components/dashboard/page-header"
import { CompactNumber } from "@/components/ui/compact-number"
import { Progress } from "@/components/ui/progress"
import { requireAuthContext } from "@/lib/auth/context"
import { getUserDashboardStats } from "@/lib/dashboard/stats"

export async function UsageStats() {
  const ctx = await requireAuthContext()
  const stats = await getUserDashboardStats(ctx.userId)

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Remaining" value={stats.remaining} />
        <StatCard label="Used" value={stats.lifetimeUsed} />
        <StatCard label="Granted" value={stats.lifetimeGranted} />
        <StatCard
          label="Chat tokens used"
          value={stats.lifetimeChatTokensUsed}
          hint={
            <>
              <CompactNumber value={stats.chatBudgetRemaining} /> remaining
            </>
          }
        />
      </div>

      <div className="surface-panel rounded-xl border border-border/60 p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <UsageScanSummary
            lifetimeUsed={stats.lifetimeUsed}
            lifetimeGranted={stats.lifetimeGranted}
            remaining={stats.remaining}
          />
        </div>
        <Progress
          value={Math.min(
            100,
            (stats.lifetimeUsed / Math.max(stats.lifetimeGranted, 1)) * 100,
          )}
          className="mt-4 h-2"
        />
      </div>

      <div className="surface-panel rounded-xl border border-border/60 p-5">
        <h2 className="font-heading text-sm font-medium">Daily scans used</h2>
        <div className="mt-4">
          <UsageBarChart data={stats.dailyUsage} />
        </div>
      </div>

      <div className="surface-panel rounded-xl border border-border/60 p-5">
        <h2 className="font-heading text-sm font-medium">Recent activity</h2>
        <div className="mt-4">
          <RecentActivityList entries={stats.recentActivity} />
        </div>
      </div>
    </>
  )
}
