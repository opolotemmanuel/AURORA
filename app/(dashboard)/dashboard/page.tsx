// The regular user's personal dashboard. Previously this page rendered
// system-wide admin analytics (all scans/reports/downloads/AI-provider
// events across every user, unfiltered) with no role check at all — any
// signed-in USER could see it. That content was a strict subset of what
// /admin already shows properly (see components/admin/admin-dashboard.tsx),
// so it's removed here entirely rather than moved. This page now only ever
// queries the signed-in user's own data via listReportsForUser's
// `where: { userId }` scoping.
//
// Presentation-only redesign pass: recommendations and scan history are now
// proper Table rows (both are genuinely row-like data — same product/
// severity/date columns each time) instead of card-grid/list treatments.
// Data fetching, session/ownership scoping, and the userId-threading fix
// are all unchanged from before.
import Link from "next/link"
import { redirect } from "next/navigation"
import { IconArrowUpRight, IconCamera } from "@tabler/icons-react"

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
import { getSession } from "@/lib/auth/session"
import { listReportsForUser, shortenReportId } from "@/lib/backend/report-store"
import { worstBandVisual } from "@/lib/reports/band-visuals"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) {
    // (dashboard)/layout.tsx already redirects when there's no session, but
    // that's a separate, independent getSession() call (a fresh DB
    // round-trip) — under a transient failure the two can disagree, so this
    // page can't just assume the layout's check already covered it.
    redirect("/login")
  }

  const reports = await listReportsForUser(session.user.id, 6)
  const latest = reports[0] ?? null
  const latestVisual = latest ? worstBandVisual(latest.analysis.cosmeticFindings) : null

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
