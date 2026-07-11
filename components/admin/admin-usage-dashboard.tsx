import { Suspense } from "react"
import Link from "next/link"

import { AdminUsageFilters } from "@/components/admin/admin-usage-filters"
import { ModelHealthPanel } from "@/components/admin/model-health-panel"
import { UsageBarChart } from "@/components/dashboard/usage-chart"
import { StatCard } from "@/components/dashboard/page-header"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { AdminUsageAnalytics } from "@/lib/admin/usage-analytics"
import { buildModelHealthSummary } from "@/lib/models/status"
import { listModelRates } from "@/lib/models/queries"
import { formatMicroUsdCompact } from "@/lib/pricing/format-cost"
import { formatTokenBreakdown } from "@/lib/tokens/format-usage"

type AdminUsageDashboardProps = {
  analytics: AdminUsageAnalytics
}

function TokenBreakdownTable({
  tokens,
}: {
  tokens: AdminUsageAnalytics["tokens"]
}) {
  const rows = [
    { label: "Input", value: tokens.inputTokens },
    { label: "Output", value: tokens.outputTokens },
    { label: "Reasoning", value: tokens.reasoningTokens },
    { label: "Cached", value: tokens.cachedTokens },
    { label: "Total", value: tokens.totalTokens },
  ]

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Token type</TableHead>
          <TableHead className="text-right">Count</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.label}>
            <TableCell>{row.label}</TableCell>
            <TableCell className="text-right tabular-nums">
              {row.value.toLocaleString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export async function AdminUsageDashboard({
  analytics,
}: AdminUsageDashboardProps) {
  const modelRates = await listModelRates()
  const modelHealth = buildModelHealthSummary(modelRates)
  const modelOptions = modelRates.map((m) => ({
    modelId: m.modelId,
    displayName: m.displayName,
  }))

  const { tokens, highlights } = analytics

  return (
    <div className="space-y-8">
      <Suspense fallback={null}>
        <AdminUsageFilters modelOptions={modelOptions} />
      </Suspense>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="AI tokens"
          value={tokens.totalTokens.toLocaleString()}
          hint={formatTokenBreakdown(tokens)}
        />
        <StatCard
          label="Est. provider cost"
          value={formatMicroUsdCompact(tokens.estimatedCostMicros)}
        />
        <StatCard
          label="Scans used"
          value={analytics.scansUsed.toLocaleString()}
          hint={`${analytics.scansGranted.toLocaleString()} granted`}
        />
        <StatCard label="Chat replies" value={analytics.chatCount} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Scans today" value={highlights.scansToday} />
        <StatCard label="Chats today" value={highlights.chatsToday} />
        <StatCard
          label="Most active user"
          value={highlights.mostActiveUser?.name ?? "—"}
          hint={highlights.mostActiveUser?.email}
        />
        <StatCard
          label="Most used model"
          value={
            highlights.mostUsedModel?.displayName ??
            highlights.mostUsedModel?.modelId ??
            "—"
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-none border border-border bg-card p-5">
          <h2 className="font-heading text-sm font-medium">Token breakdown</h2>
          <div className="mt-4">
            <TokenBreakdownTable tokens={tokens} />
          </div>
        </div>
        <div className="rounded-none border border-border bg-card p-5">
          <h2 className="font-heading text-sm font-medium">Cost by model</h2>
          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.perModel.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      No usage in this period
                    </TableCell>
                  </TableRow>
                ) : (
                  analytics.perModel.map((row) => (
                    <TableRow key={row.modelId}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {row.displayName ?? row.modelId}
                          </p>
                          {row.assignedTier ? (
                            <p className="text-xs capitalize text-muted-foreground">
                              {row.assignedTier} tier
                            </p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.tokens.totalTokens.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMicroUsdCompact(row.tokens.estimatedCostMicros)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.sharePercent}%
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-none border border-border bg-card p-5">
          <h2 className="font-heading text-sm font-medium">Tokens over time</h2>
          <div className="mt-4">
            <UsageBarChart
              data={analytics.tokenSeries.map((b) => ({
                label: b.label,
                value: b.tokens,
              }))}
              label="Tokens"
            />
          </div>
        </div>
        <div className="rounded-none border border-border bg-card p-5">
          <h2 className="font-heading text-sm font-medium">Cost over time (USD)</h2>
          <div className="mt-4">
            <UsageBarChart data={analytics.costSeries} label="USD" />
          </div>
        </div>
      </div>

      <div className="rounded-none border border-border bg-card p-5">
        <h2 className="font-heading text-sm font-medium">Per-model usage</h2>
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Scans</TableHead>
                <TableHead className="text-right">Chats</TableHead>
                <TableHead className="text-right">In</TableHead>
                <TableHead className="text-right">Out</TableHead>
                <TableHead className="text-right">Reasoning</TableHead>
                <TableHead className="text-right">Cached</TableHead>
                <TableHead className="text-right">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.perModel.map((row) => (
                <TableRow key={row.modelId}>
                  <TableCell>{row.displayName ?? row.modelId}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.scanCount}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.chatCount}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.tokens.inputTokens.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.tokens.outputTokens.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.tokens.reasoningTokens.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.tokens.cachedTokens.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMicroUsdCompact(row.tokens.estimatedCostMicros)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="rounded-none border border-border bg-card p-5">
        <h2 className="font-heading text-sm font-medium">Top users by tokens</h2>
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Scans</TableHead>
                <TableHead className="text-right">Chats</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.perUser.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No user usage in this period
                  </TableCell>
                </TableRow>
              ) : (
                analytics.perUser.map((row) => (
                  <TableRow key={row.userId}>
                    <TableCell>
                      <Link
                        href="/admin/users"
                        className="hover:text-primary hover:underline"
                      >
                        <p className="font-medium">{row.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.email}
                        </p>
                      </Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.scanCount}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.chatCount}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.tokens.totalTokens.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMicroUsdCompact(row.tokens.estimatedCostMicros)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ModelHealthPanel summary={modelHealth} />
    </div>
  )
}
