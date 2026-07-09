// Spec section 11 — placed at the very bottom of every report.
import { IconShieldCheck } from "@tabler/icons-react"

import type { ReportViewModel } from "@/lib/reports/report-view-model"

export function Disclaimer({}: { vm: ReportViewModel }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/50 p-5 text-sm text-muted-foreground print:break-inside-avoid">
      <IconShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
      <p>
        This report is generated using artificial intelligence and is intended to provide informational skin
        insights only. It does not constitute a medical diagnosis or replace consultation with a qualified
        healthcare professional.
      </p>
    </div>
  )
}
