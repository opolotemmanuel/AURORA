// New route per this pass's spec — self-service only, no role check beyond
// "is signed in" (already enforced by the parent (dashboard)/layout.tsx).
// Fetches the signed-in user's own row via findReportOwner (report-store.ts),
// scoped by session.user.id — never any other user's row.
import Link from "next/link"
import { redirect } from "next/navigation"
import { IconCalendar, IconLock, IconMail, IconUserCircle } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getSession } from "@/lib/auth/session"
import { findReportOwner } from "@/lib/backend/report-store"

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
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
          <IconUserCircle className="size-4" />
          Profile
        </p>
        <h1 className="text-3xl font-semibold tracking-normal">Your account</h1>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">
          Personal account details — visible only to you.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Account details</CardTitle>
          <CardDescription>Read-only for now</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProfileRow icon={IconUserCircle} label="Name" value={profile?.name ?? "Not set"} />
          <ProfileRow icon={IconMail} label="Email" value={profile?.email ?? session.user.email} />
          <ProfileRow
            icon={IconCalendar}
            label="Member since"
            value={formatDate(profile?.createdAt ?? session.user.createdAt)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account actions</CardTitle>
          <CardDescription>Password and account deletion live in Account Settings</CardDescription>
        </CardHeader>
        <CardContent>
          {/* In-session password change and real account deletion both live
              on /account now (components/account/change-password-form.tsx,
              components/account/delete-account-section.tsx) — pointing here
              instead of duplicating either form keeps password/deletion
              logic in exactly one place. */}
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted p-4">
            <div className="flex items-center gap-3">
              <IconLock className="size-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Password &amp; account deletion</p>
                <p className="text-xs text-muted-foreground">
                  Change your password or permanently delete your account.
                </p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/account">Go to Account Settings</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
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
      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-primary">
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}

function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
}
