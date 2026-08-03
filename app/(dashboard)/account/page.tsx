// User-facing account settings — distinct from /settings, which is the
// pre-existing admin product-catalog/enterprise page (see
// components/layouts/dashboard-sidebar.tsx's ADMINISTRATION_SECTION comment for
// why these are two separate routes). Self-service only, scoped to the
// signed-in user's own row via getSession(), same pattern as /profile.
import Link from "next/link"
import { redirect } from "next/navigation"
import { IconCalendar, IconCloud, IconLock, IconMapPin, IconSettings, IconUserCircle } from "@tabler/icons-react"

import { AllergiesForm } from "@/components/account/allergies-form"
import { ChangePasswordForm } from "@/components/account/change-password-form"
import { LiveClimateCheck } from "@/components/account/live-climate-check"
import { ManageYourDataCard } from "@/components/account/manage-your-data-card"
import { EditNameForm } from "@/components/profile/edit-name-form"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrustSignalRow } from "@/components/ui/trust-signal-row"
import { getSession } from "@/lib/auth/session"
import { getYourDataSummary } from "@/lib/backend/account-data"
import { findReportOwner, listReportsForUser } from "@/lib/backend/report-store"
import { getUserAllergies } from "@/lib/user/allergies-store"

export const dynamic = "force-dynamic"

// Climate is deliberately transient — one weather READING per report, tied
// to that scan, never an ongoing saved location (see prisma/schema.prisma's
// ClimateReading doc comment). This tab has no "current" climate to show
// outside an active scan, so it looks backward for the most recent report
// that happened to have one — not just the single latest report overall,
// since a fetch failure on the newest scan shouldn't hide real climate data
// from an earlier one. 20 is a generous-but-bounded window: enough to find
// a climate-enabled report for any reasonably active user without an
// unbounded query.
const CLIMATE_LOOKBACK_REPORT_COUNT = 20
const ACCOUNT_TAB_VALUES = ["account", "climate", "your-data"] as const
type AccountTabValue = (typeof ACCOUNT_TAB_VALUES)[number]

type AccountSettingsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function AccountSettingsPage({ searchParams }: AccountSettingsPageProps) {
  const session = await getSession()
  if (!session) {
    // (dashboard)/layout.tsx already redirects when there's no session, but
    // that's a separate, independent getSession() call (a fresh DB
    // round-trip) — under a transient failure the two can disagree, so this
    // page can't just assume the layout's check already covered it.
    redirect("/login")
  }

  const profile = await findReportOwner(session.user.id)
  const recentReports = await listReportsForUser(session.user.id, CLIMATE_LOOKBACK_REPORT_COUNT)
  const latestClimateReport = recentReports.find((report) => report.climate) ?? null
  const email = profile?.email ?? session.user.email
  const yourDataSummary = await getYourDataSummary(session.user.id)
  const allergies = await getUserAllergies(session.user.id)

  // Lets other pages (the dashboard Overview's climate touchpoint) deep-
  // link straight to a specific tab, e.g. /account?tab=climate — purely
  // additive: an absent or unrecognized value falls back to the exact
  // same "account" default this page always had.
  const requestedTab = (await searchParams).tab
  const initialTab: AccountTabValue =
    typeof requestedTab === "string" && ACCOUNT_TAB_VALUES.includes(requestedTab as AccountTabValue)
      ? (requestedTab as AccountTabValue)
      : "account"

  return (
    <div className="max-w-2xl space-y-8">
      <section className="space-y-2">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase">
          <IconSettings className="size-4" />
          Settings
        </p>
        <h1 className="text-3xl font-semibold tracking-normal">Account settings</h1>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">
          Manage your account preferences and data.
        </p>
      </section>

      <Tabs defaultValue={initialTab}>
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="climate">Climate</TabsTrigger>
          <TabsTrigger value="your-data">Your data</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Account details</CardTitle>
                  <CardDescription>Email is read-only for now</CardDescription>
                </div>
                {profile?.role ? (
                  <Badge variant={profile.role === "USER" ? "secondary" : "default"}>{profile.role}</Badge>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <EditNameForm initialName={profile?.name ?? ""} />
              <div className="space-y-4 border-t border-border pt-4">
                <ProfileRow icon={IconUserCircle} label="Email" value={email} />
                <ProfileRow
                  icon={IconCalendar}
                  label="Account created"
                  value={formatDate(profile?.createdAt ?? session.user.createdAt)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change password</CardTitle>
              <CardDescription>
                Requires your current password. Need to reset it instead?{" "}
                <Link href="/forgot-password" className="font-medium text-primary hover:underline">
                  Send a reset link
                </Link>
                .
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Allergies</CardTitle>
              <CardDescription>Shapes which Aurora products can ever be recommended to you</CardDescription>
            </CardHeader>
            <CardContent>
              <AllergiesForm initialAllergies={allergies} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="climate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Climate-based recommendations</CardTitle>
              <CardDescription>How local weather shapes your scan results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6 text-muted-foreground">
                Each time you take a scan, Aurora Organics asks for your location for that scan only — it&apos;s never saved as
                an ongoing preference. It&apos;s used once to fetch live local weather (temperature, humidity, UV
                index), which factors into that scan&apos;s product recommendations and its Comfort Score. Only the
                resulting weather reading is kept, tied to that one report — your location itself is never stored.
              </p>

              {/* Same trust-signal footer style as /scan's dropzone
                  (components/scan/ScanFlow.tsx) — reused here since this
                  paragraph is making the exact same kind of privacy
                  assurance about location/climate data. */}
              <TrustSignalRow
                items={[
                  { icon: IconMapPin, label: "This scan only, never an ongoing preference" },
                  { icon: IconCloud, label: "Weather reading only — no raw location stored" },
                  { icon: IconLock, label: "Tied to one report, never a saved profile setting" },
                ]}
                className="justify-start"
              />

              <LiveClimateCheck />

              <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                Your most recent scan
              </p>
              {latestClimateReport?.climate ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted p-4">
                  <div className="flex items-center gap-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                      <IconCloud className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Your last scan factored in {Math.round(latestClimateReport.climate.temperatureC)}°C,{" "}
                        {Math.round(latestClimateReport.climate.humidityPercent)}% humidity, UV index{" "}
                        {Math.round(latestClimateReport.climate.uvIndex)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDate(latestClimateReport.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/reports/${latestClimateReport.id}`}
                    className="shrink-0 text-sm font-medium text-primary hover:underline"
                  >
                    View full report
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted p-4">
                  <div className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <IconCloud className="size-4" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No climate data yet — take a scan and share your location to see how local weather shapes your
                    results.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="your-data" className="space-y-4">
          <ManageYourDataCard email={email} summary={yourDataSummary} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
}

function ProfileRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="size-4 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}
