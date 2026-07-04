import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth/server"
import { requireSession } from "@/lib/auth/session"
import { syncUserClimateAction } from "@/lib/onboarding/actions"
import { prisma } from "@/lib/db/client"

export default async function SettingsPage() {
  const session = await requireSession()
  const location = await prisma.userLocation.findUnique({
    where: { userId: session.user.id },
  })

  async function syncClimate() {
    "use server"
    await syncUserClimateAction()
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-medium">Settings</h1>
        <p className="text-sm text-muted-foreground">Account and location preferences.</p>
      </div>

      <section className="space-y-3 rounded-lg border border-border p-4">
        <h2 className="font-heading text-sm font-medium">Account</h2>
        <p className="text-sm text-muted-foreground">{session.user.email}</p>
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
      </section>

      <section className="space-y-3 rounded-lg border border-border p-4">
        <h2 className="font-heading text-sm font-medium">Climate cache</h2>
        {location ? (
          <p className="text-sm text-muted-foreground">
            {location.city}, {location.region} — zone {location.climateZone ?? "unknown"}
            {location.lastSyncedAt
              ? ` (synced ${location.lastSyncedAt.toLocaleDateString()})`
              : ""}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">No location on file.</p>
        )}
        <form action={syncClimate}>
          <Button type="submit" variant="secondary">
            Refresh climate bands
          </Button>
        </form>
      </section>

      <p className="text-sm text-muted-foreground">
        <a href="/forgot-password" className="underline underline-offset-4">
          Reset password via email
        </a>
      </p>
    </div>
  )
}
