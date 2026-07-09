// Spec section 1. The uploaded photo itself is never persisted (AGENTS.md's
// privacy rule: "store the report, not the photo, by default") — so instead
// of the mockup's original-image panel, this shows a clear, honest
// placeholder rather than fabricating or hotlinking a stand-in image.
import { IconLeaf, IconPhotoOff } from "@tabler/icons-react"

import type { ReportViewModel } from "@/lib/reports/report-view-model"

export function CoverHeader({ vm }: { vm: ReportViewModel }) {
  return (
    <div className="grid gap-8 rounded-2xl border border-border bg-card p-8 shadow-sm md:grid-cols-[minmax(0,220px)_1fr] print:break-inside-avoid">
      <div className="grid place-items-center rounded-xl border border-dashed border-border bg-muted text-center text-muted-foreground">
        <div className="space-y-2 p-6">
          <IconPhotoOff className="mx-auto size-8" />
          <p className="text-xs leading-5">
            Original photo not retained. Aura reports store AI findings only, not the scan image, by default.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <IconLeaf className="size-5 text-primary" />
          <span className="font-heading text-sm font-medium tracking-wide">Aura</span>
        </div>

        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground">AI Skin Intelligence Report</h1>
          <p className="mt-2 text-muted-foreground">
            Personalized skin insights powered by artificial intelligence.
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-4">
          <InfoItem label="Patient" value={vm.owner.name} />
          <InfoItem label="Report ID" value={vm.reportShortId} />
          <InfoItem label="Scan Date" value={vm.executiveSummary.scanDateLabel} />
          <InfoItem
            label="Time"
            value={vm.createdAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          />
          {vm.owner.userId ? <InfoItem label="User ID" value={vm.owner.userId} /> : null}
        </dl>
      </div>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-1 font-medium text-foreground">{value}</dd>
    </div>
  )
}
