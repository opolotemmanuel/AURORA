// Spec section 1. The uploaded photo itself is never persisted (AGENTS.md's
// privacy rule: "store the report, not the photo, by default") — so instead
// of the mockup's original-image panel, this shows a clear, honest
// placeholder rather than fabricating or hotlinking a stand-in image.
import { IconLeaf, IconPhotoOff } from "@tabler/icons-react"

import type { ReportViewModel } from "@/lib/reports/report-view-model"

// grid-cols-1 below md: Tailwind's grid-cols-N always includes minmax(0,
// ...) per track, so the single column can actually shrink to the
// viewport. Without an explicit base-breakpoint value, a grid container
// falls back to the browser's default (no grid-template-columns at all),
// which sizes the implicit column to its widest child's min-content — the
// photo placeholder's intrinsic width — and drags the whole card, and the
// page, wider.
export function CoverHeader({ vm }: { vm: ReportViewModel }) {
  return (
    <div className="grid grid-cols-1 gap-8 rounded-2xl border border-border bg-card p-8 shadow-sm md:grid-cols-[minmax(0,220px)_1fr] print:break-inside-avoid">
      {/* min-w-0: a grid item's default min-width is auto (its content's
          min-content size), same gotcha as the track itself above — without
          it this placeholder's own text keeps forcing the item wider than
          its 0px-minimum track. */}
      <div className="grid min-w-0 place-items-center rounded-xl border border-dashed border-border bg-muted text-center text-muted-foreground">
        <div className="w-full min-w-0 space-y-2 p-6">
          <IconPhotoOff className="mx-auto size-8" />
          <p className="text-xs leading-5">
            Original photo not retained. Aura reports store AI findings only, not the scan image, by default.
          </p>
        </div>
      </div>

      <div className="min-w-0 space-y-6">
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
