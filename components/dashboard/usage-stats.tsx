import { UsageBarChart } from "@/components/dashboard/usage-chart"
import { StatCard } from "@/components/dashboard/page-header"
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

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-heading text-sm font-medium">Daily token usage</h2>
        <div className="mt-4">
          <UsageBarChart data={stats.dailyUsage} />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-heading text-sm font-medium">Recent activity</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {stats.recentActivity.length === 0 ? (
            <li className="text-muted-foreground">No ledger entries yet.</li>
          ) : (
            stats.recentActivity.map((entry, i) => (
              <li
                key={i}
                className="flex justify-between gap-4 border-b border-border py-2 last:border-0"
              >
                <span className="capitalize text-muted-foreground">
                  {entry.reason.replace(/_/g, " ")}
                </span>
                <span
                  className={
                    entry.delta > 0 ? "text-foreground" : "text-muted-foreground"
                  }
                >
                  {entry.delta > 0 ? "+" : ""}
                  {entry.delta.toLocaleString()}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </>
  )
}
