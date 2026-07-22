import Link from "next/link"
import type { ComponentType } from "react"
import {
  IconDownload,
  IconFlower,
  IconMessageCircle,
  IconPhotoScan,
  IconReportAnalytics,
  IconUserCircle,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DeleteAccountSection } from "@/components/account/delete-account-section"

export type YourDataSummary = {
  totalScans: number
  totalReports: number
  totalChatMessages: number
  hasDoshaProfile: boolean
}

// Shared between the /account "Your data" tab and the standalone /privacy
// page — both surface the same real data summary, download, and deletion
// actions, so there is one place that decides what "manage your data"
// means rather than two copies drifting apart (see app/(dashboard)/
// privacy/page.tsx's doc comment).
export function ManageYourDataCard({ email, summary }: { email: string; summary: YourDataSummary }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Your data</CardTitle>
          <CardDescription>A real summary of what&apos;s stored under your account</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <DataStat icon={IconPhotoScan} label="Scans" value={summary.totalScans} />
          <DataStat icon={IconReportAnalytics} label="Reports" value={summary.totalReports} />
          <DataStat icon={IconMessageCircle} label="Chat messages" value={summary.totalChatMessages} />
          <DataStat
            icon={IconFlower}
            label="Dosha profile"
            value={summary.hasDoshaProfile ? "Completed" : "Not taken"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage your data</CardTitle>
          <CardDescription>Edit your profile or download a copy of what we hold</CardDescription>
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
              <IconDownload className="size-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Download your data</p>
                <p className="text-xs text-muted-foreground">
                  Export your reports, findings, and recommendations as JSON.
                </p>
              </div>
            </div>
            {/* Plain <a>, not next/link's <Link>: this route streams a real
                file with Content-Disposition: attachment, and Link's
                client-side soft navigation would defeat that header —
                same fix already applied to the PDF download link, see
                app/(dashboard)/reports/[reportId]/page.tsx. */}
            <Button asChild variant="outline" size="sm">
              <a href="/api/account/data-export">Download JSON</a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <DeleteAccountSection email={email} />
    </div>
  )
}

function DataStat({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string | number
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted p-4">
      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-background text-primary">
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}
