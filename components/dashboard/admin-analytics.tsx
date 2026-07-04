import { RoleDistributionChart, UsageBarChart } from "@/components/dashboard/usage-chart"
import { StatCard } from "@/components/dashboard/page-header"
import { getAdminDashboardStats } from "@/lib/dashboard/stats"

export async function AdminAnalytics() {
  const stats = await getAdminDashboardStats()

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Users" value={stats.userCount} />
        <StatCard label="Scans" value={stats.scanCount} />
        <StatCard label="Active products" value={stats.productCount} />
        <StatCard label="Tokens used" value={stats.totalUsed.toLocaleString()} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-heading text-sm font-medium">Token grants (14 days)</h2>
          <div className="mt-4">
            <UsageBarChart data={stats.grantsByDay} label="Granted" />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-heading text-sm font-medium">Token usage (14 days)</h2>
          <div className="mt-4">
            <UsageBarChart data={stats.usageByDay} label="Used" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-heading text-sm font-medium">Users by role</h2>
          <div className="mt-4">
            <RoleDistributionChart data={stats.usersByRole} />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-heading text-sm font-medium">Scans by status</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {stats.scansByStatus.map((s) => (
              <li
                key={s.status}
                className="flex justify-between border-b border-border py-2 last:border-0"
              >
                <span className="capitalize text-muted-foreground">{s.status}</span>
                <span>{s.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-heading text-sm font-medium">Recent sign-ups</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {stats.recentUsers.map((u) => (
            <li
              key={u.id}
              className="flex justify-between gap-4 border-b border-border py-2 last:border-0"
            >
              <span>
                {u.name} — {u.email}
              </span>
              <span className="text-muted-foreground">{u.role ?? "user"}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
