// Spec section 1. The uploaded photo itself is never persisted (AGENTS.md's
// privacy rule: "store the report, not the photo, by default") — that fact
// is covered once, in the closing disclaimer (see disclaimer.tsx), rather
// than called out again here with a placeholder panel.
import { AuroraLogomark } from "@/components/brand/aurora-logomark"
import type { ReportViewModel } from "@/lib/reports/report-view-model"

export function CoverHeader({ vm }: { vm: ReportViewModel }) {
  return (
    <div className="space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm print:break-inside-avoid">
      <div className="flex items-center gap-2">
        <AuroraLogomark />
        <span className="font-heading text-sm font-medium tracking-wide">Aurora Organics</span>
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
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs tracking-wide text-muted-foreground uppercase">{label}</dt>
      {/* break-all: User ID/Report ID values are unbroken cuid-style
          strings with no natural wrap points — without it, one long value
          overflows its grid cell and drags the whole page wider on narrow
          viewports instead of wrapping. */}
      <dd className="mt-1 font-medium break-all text-foreground">{value}</dd>
    </div>
  )
}
