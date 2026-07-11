// User-facing account settings — distinct from /settings, which is the
// pre-existing admin product-catalog/enterprise page (see
// components/layouts/dashboard-sidebar.tsx's ADMINISTRATION_SECTION comment for
// why these are two separate routes). Self-service only, scoped to the
// signed-in user's own row via getSession(), same pattern as /profile.
import { redirect } from "next/navigation"
import { IconCloud, IconSettings, IconUserCircle } from "@tabler/icons-react"

import { ManageYourDataCard } from "@/components/account/manage-your-data-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getSession } from "@/lib/auth/session"
import { findReportOwner } from "@/lib/backend/report-store"

export const dynamic = "force-dynamic"

export default async function AccountSettingsPage() {
  const session = await getSession()
  if (!session) {
    // (dashboard)/layout.tsx already redirects when there's no session, but
    // that's a separate, independent getSession() call (a fresh DB
    // round-trip) — under a transient failure the two can disagree, so this
    // page can't just assume the layout's check already covered it.
    redirect("/login")
  }

  const profile = await findReportOwner(session.user.id)

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

      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="climate">Climate</TabsTrigger>
          <TabsTrigger value="your-data">Your data</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account details</CardTitle>
              <CardDescription>Read-only for now</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProfileRow icon={IconUserCircle} label="Name" value={profile?.name ?? "Not set"} />
              <ProfileRow
                icon={IconUserCircle}
                label="Email"
                value={profile?.email ?? session.user.email}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="climate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Climate-based recommendations</CardTitle>
              <CardDescription>Coming soon</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted p-4">
                <IconCloud className="size-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Climate-based recommendations are coming soon — this is a planned Phase 2 feature and isn&apos;t
                  built yet.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="your-data" className="space-y-4">
          <ManageYourDataCard />
        </TabsContent>
      </Tabs>
    </div>
  )
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
