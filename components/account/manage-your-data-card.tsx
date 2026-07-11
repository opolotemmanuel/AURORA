import Link from "next/link"
import { IconLock, IconUserCircle } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Shared between the /account "Your data" tab and the standalone /privacy
// page — both surface the same two actions, so there is one place that
// decides what "manage your data" means rather than two copies drifting
// apart. "Privacy & deletion" stays a disabled placeholder because there is
// no real delete-account flow yet (see app/(dashboard)/profile/page.tsx's
// identical "Coming soon" button) — do not fake one here.
export function ManageYourDataCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage your data</CardTitle>
        <CardDescription>Edit your profile or review data and deletion options</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted p-4">
          <div className="flex items-center gap-3">
            <IconUserCircle className="size-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Edit profile</p>
              <p className="text-xs text-muted-foreground">Update your name, email, and account details.</p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/profile">Edit profile</Link>
          </Button>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted p-4">
          <div className="flex items-center gap-3">
            <IconLock className="size-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Privacy & deletion</p>
              <p className="text-xs text-muted-foreground">
                Review data retention and delete your account. Not available yet.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" disabled>
            Coming soon
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
