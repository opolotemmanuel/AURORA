// The regular user's personal dashboard. Previously this page rendered
// system-wide admin analytics (all scans/reports/downloads/AI-provider
// events across every user, unfiltered) with no role check at all — any
// signed-in USER could see it. That content was a strict subset of what
// /admin already shows properly (see components/admin/admin-dashboard.tsx),
// so it's removed here entirely rather than moved. This page now only ever
// queries the signed-in user's own data via listReportsForUser's
// `where: { userId }` scoping.
//
// Density pass (2026-07-23): added a stat-card row + a real usage-over-time
// chart + a recent-activity feed, matching wyasyn/review's dashboard
// layout density — see components/dashboard/{stat-card,usage-chart,
// recent-activity-list}.tsx.
//
// Nudges/touchpoints pass: added an allergy nudge (only when
// user.allergies is unset — reuses lib/user/allergies-store.ts's
// getUserAllergies, the same read /account's Allergies form uses) and a
// climate touchpoint (only when a real ClimateReading exists — reused
// directly from the `reports` array already fetched below for the scan-
// history table, the exact same "most recent report with a climate
// reading" lookup app/(dashboard)/account/page.tsx's Climate tab uses, no
// second query) and three entry-point cards to the chat/history/latest-
// report routes. Every number/condition on this page is real — nothing
// fabricated, nothing shown with no real feature behind it.
import Link from "next/link"
import { redirect } from "next/navigation"
import {
  IconAlertTriangle,
  IconArrowUpRight,
  IconCamera,
  IconChartLine,
  IconCloud,
  IconFlower,
  IconReportAnalytics,
  IconSparkles,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RecentActivityList } from "@/components/dashboard/recent-activity-list"
import { StatCard } from "@/components/dashboard/stat-card"
import { ScanUsageChart } from "@/components/dashboard/usage-chart"
import { getSession } from "@/lib/auth/session"
import { listReportsForUser, shortenReportId, getScanCountsByDayForUser } from "@/lib/backend/report-store"
import { DOSHA_LABELS } from "@/lib/dosha/dosha-content"
import { getDoshaProfile } from "@/lib/dosha/dosha-store"
import { buildDailyScanSeries, getStartOfDayNDaysAgo } from "@/lib/dashboard/usage-series"
import { worstBandVisual } from "@/lib/reports/band-visuals"
import { getOrCreateScanBalance, getRecentLedgerForUser } from "@/lib/scans/balance"
import { getUserAllergies } from "@/lib/user/allergies-store"

export const dynamic = "force-dynamic"

const USAGE_WINDOW_DAYS = 14

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) {
    // (dashboard)/layout.tsx already redirects when there's no session, but
    // that's a separate, independent getSession() call (a fresh DB
    // round-trip) — under a transient failure the two can disagree, so this
    // page can't just assume the layout's check already covered it.
    redirect("/login")
  }

  const userId = session.user.id
  const since = getStartOfDayNDaysAgo(USAGE_WINDOW_DAYS)

  const [reports, balance, doshaProfile, recentLedger, scanCountsByDay, allergies] = await Promise.all([
    listReportsForUser(userId, 6),
    getOrCreateScanBalance(userId),
    getDoshaProfile(userId),
    getRecentLedgerForUser(userId, 8),
    getScanCountsByDayForUser(userId, since),
    getUserAllergies(userId),
  ])

  const latest = reports[0] ?? null
  const latestVisual = latest ? worstBandVisual(latest.analysis.cosmeticFindings) : null
  const usageSeries = buildDailyScanSeries(scanCountsByDay, USAGE_WINDOW_DAYS)
  const needsAllergyNudge = !allergies?.trim()
  // Same lookup app/(dashboard)/account/page.tsx's Climate tab runs
  // (find the newest report that actually has a saved reading, since a
  // weather-fetch failure on the newest scan shouldn't hide real climate
  // data from an earlier one) — reused against the `reports` array
  // already fetched above instead of a second query.
  const latestClimateReport = reports.find((report) => report.climate) ?? null

  return (
    <div className="space-y-10">
      <section className="flex flex-col gap-4 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase">
            <IconCamera className="size-4" />
            Aura
          </p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-normal">
            Welcome back{session.user.name ? `, ${session.user.name}` : ""}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Your personal skin intelligence overview — scans, reports, and product matches.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/scan">
            <IconCamera className="size-4" />
            Start a new scan
          </Link>
        </Button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Scans remaining" value={balance.remaining} hint="Of 10 free scans" />
        <StatCard label="Scans used" value={balance.lifetimeUsed} hint="All time" />
        {doshaProfile ? (
          <StatCard
            label="Dosha result"
            value={DOSHA_LABELS[doshaProfile.primaryDosha]}
            hint={doshaProfile.secondaryDosha ? `with ${DOSHA_LABELS[doshaProfile.secondaryDosha]}` : "Primary type"}
          />
        ) : (
          <Card size="sm">
            <CardContent className="flex h-full flex-col justify-between gap-2">
              <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Dosha result</p>
              <Link
                href="/dosha-assessment"
                className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <IconFlower className="size-4" />
                Take the assessment
              </Link>
            </CardContent>
          </Card>
        )}
        <StatCard
          label="Most recent scan"
          value={latest ? formatDate(latest.createdAt) : "—"}
          hint={latest ? shortenReportId(latest.id) : "No scans yet"}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Scans over time</CardTitle>
            <CardDescription>Your own scan activity, last {USAGE_WINDOW_DAYS} days</CardDescription>
          </CardHeader>
          <CardContent>
            <ScanUsageChart data={usageSeries} />
          </CardContent>
        </Card>

        {/* Right column shows whichever is more useful right now: the
            allergy nudge when it's genuinely unset (a real safety gap —
            declared allergens are excluded from recommendations
            entirely, not just ranked lower), or Recent activity when
            there's nothing to nudge about. Never both, never neither. */}
        {needsAllergyNudge ? (
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="flex h-full flex-col justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-warning/10 text-warning">
                  <IconAlertTriangle className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Declare your allergies</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Products with a declared allergen are excluded from your recommendations entirely — add yours
                    so Aura never suggests one.
                  </p>
                </div>
              </div>
              <Button asChild size="sm" variant="outline" className="self-start">
                <Link href="/account">Add allergies</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>Your scan credit history</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentActivityList entries={recentLedger} />
            </CardContent>
          </Card>
        )}
      </section>

      {latestClimateReport?.climate ? (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <IconCloud className="size-4 shrink-0 text-primary" />
          <span>
            Your last scan factored in {Math.round(latestClimateReport.climate.temperatureC)}°C,{" "}
            {Math.round(latestClimateReport.climate.humidityPercent)}% humidity.
          </span>
          <Link href="/account?tab=climate" className="font-medium text-primary hover:underline">
            Check today&apos;s weather
          </Link>
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <EntryPointCard
          href="/skin-advice"
          icon={IconSparkles}
          label="Ask about your skin"
          description="Chat with Aura about your routine, ingredients, or concerns."
        />
        <EntryPointCard
          href="/skin-history"
          icon={IconChartLine}
          label="See your trends"
          description="How your cosmetic readings have moved across scans."
        />
        <EntryPointCard
          href={latest ? `/reports/${latest.id}` : "/scan"}
          icon={IconReportAnalytics}
          label="Latest recommendations"
          description={
            latest ? "Products matched to your most recent scan." : "Take a scan to get your first matches."
          }
        />
      </section>

      {latest && latestVisual ? (
        <section className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/40 px-5 py-4">
          <div className="flex items-center gap-3">
            <Badge variant={latestVisual.badgeVariant}>{latestVisual.wellnessLabel}</Badge>
            <div>
              <p className="text-sm font-medium text-foreground">Latest scan &middot; {formatDate(latest.createdAt)}</p>
              <p className="mt-0.5 max-w-xl truncate text-xs text-muted-foreground">{latest.analysis.summary}</p>
            </div>
          </div>
          <Link
            href={`/reports/${latest.id}`}
            className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View full report
            <IconArrowUpRight className="size-4" />
          </Link>
        </section>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <IconCamera className="size-8 text-muted-foreground" />
            <div>
              <p className="font-medium">You haven&apos;t taken a scan yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Start your first AI skin scan to get personalized cosmetic insights.
              </p>
            </div>
            <Button asChild>
              <Link href="/scan">Take your first scan</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {latest && latest.recommendations.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Recommended for you</CardTitle>
            <CardDescription>From your latest scan</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Match</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latest.recommendations.slice(0, 3).map((recommendation) => (
                  <TableRow key={recommendation.product.id}>
                    <TableCell className="font-medium">{recommendation.product.name}</TableCell>
                    <TableCell className="text-muted-foreground">{recommendation.product.category}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{recommendation.matchStrength}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Scan history</CardTitle>
          <CardDescription>Your own scans and reports only</CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => {
                  const visual = worstBandVisual(report.analysis.cosmeticFindings)
                  return (
                    <TableRow key={report.id}>
                      <TableCell className="whitespace-nowrap font-medium">
                        {formatDate(report.createdAt)}
                        <span className="ml-2 font-normal text-muted-foreground">{shortenReportId(report.id)}</span>
                      </TableCell>
                      <TableCell className="max-w-sm truncate text-muted-foreground">
                        {report.analysis.summary}
                      </TableCell>
                      <TableCell>
                        <Badge variant={visual.badgeVariant}>{visual.wellnessLabel}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/reports/${report.id}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          View report
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <EmptyState label="No scans yet — they'll show up here once you complete one." />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return <div className="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">{label}</div>
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
}

function EntryPointCard({
  href,
  icon: Icon,
  label,
  description,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
}) {
  return (
    <Link href={href} className="group block">
      <Card className="h-full transition-colors group-hover:border-primary/40">
        <CardContent className="flex h-full flex-col gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-primary">
            <Icon className="size-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{label}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
