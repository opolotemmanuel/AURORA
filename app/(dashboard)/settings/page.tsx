import Link from "next/link"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { DashboardPageHeader } from "@/components/dashboard/page-header"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth/server"
import { requireSession } from "@/lib/auth/session"
import { getRoleLabel, type AppRole } from "@/lib/dashboard/nav"
import { syncUserClimateAction } from "@/lib/onboarding/actions"
import { prisma } from "@/lib/db/client"

export default async function SettingsPage() {
  const session = await requireSession()
  const role = ((session.user as { role?: string }).role ?? "user") as AppRole
  const location = await prisma.userLocation.findUnique({
    where: { userId: session.user.id },
  })

  async function syncClimate() {
    "use server"
    await syncUserClimateAction()
  }

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Settings"
        description="Account preferences and session."
        badge={getRoleLabel(role)}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border p-5">
          <h2 className="font-heading text-sm font-medium">Account</h2>
          <p className="mt-2 text-sm text-muted-foreground">{session.user.email}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <form
              action={async () => {
                "use server"
                await auth.api.signOut({ headers: await headers() })
                redirect("/login")
              }}
            >
              <Button type="submit" variant="outline">
                Sign out
              </Button>
            </form>
            <Button asChild variant="secondary">
              <Link href="/forgot-password">Reset password</Link>
            </Button>
          </div>
        </section>

        <section className="rounded-xl border border-border p-5">
          <h2 className="font-heading text-sm font-medium">Climate cache</h2>
          {location?.city ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {location.city}, {location.region} — {location.climateZone ?? "unknown"}
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No location on file.</p>
          )}
          <form action={syncClimate} className="mt-4">
            <Button type="submit" variant="secondary">
              Refresh climate bands
            </Button>
          </form>
        </section>
      </div>

      <section className="rounded-xl border border-border p-5">
        <h2 className="font-heading text-sm font-medium">Manage your data</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Edit profile fields or delete personal data.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/profile">Edit profile</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/privacy">Privacy & deletion</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
