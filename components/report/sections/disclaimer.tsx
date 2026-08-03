// Spec section 11 — placed at the very bottom of every report.
import { IconShieldCheck } from "@tabler/icons-react"

import type { ReportViewModel } from "@/lib/reports/report-view-model"

export function Disclaimer({}: { vm: ReportViewModel }) {
  return (
    // report-disclaimer: styling hook for the print stylesheet (see
    // app/globals.css's `@media print` block) — kept as a plain marker
    // class, not a new utility, so this stays visually identical on screen
    // and exists purely so print CSS can single this section out to stay
    // exactly as prominent as it is today, not flattened like the rest.
    <div className="report-disclaimer flex items-start gap-3 rounded-xl border border-border bg-muted/50 p-5 text-sm text-muted-foreground print:break-inside-avoid">
      <IconShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
      <p>
        This report is generated using artificial intelligence and is intended to provide informational skin
        insights only. It does not constitute a medical diagnosis or replace consultation with a qualified
        healthcare professional. Aurora Organics reports store AI findings only, not the scan image, by default.
      </p>
    </div>
  )
}
