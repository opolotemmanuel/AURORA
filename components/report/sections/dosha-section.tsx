// New section: the report owner's Ayurvedic dosha result, when they've
// completed the (opt-in) questionnaire — see report-sections.config.ts's
// isEnabled gate. Reuses DOSHA_CONTENT and the disclaimer copy already
// written and approved for the dosha-assessment results page
// (components/dosha/dosha-results.tsx) rather than inventing new copy; this
// is a condensed, report-styled read of the same data, not a second source
// of truth.
import { IconLeaf, IconShieldCheck } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DOSHA_CONTENT, DOSHA_LABELS } from "@/lib/dosha/dosha-content"
import type { Dosha } from "@/lib/dosha/questions"
import type { ReportViewModel } from "@/lib/reports/report-view-model"

const DOSHA_ORDER: Dosha[] = ["vata", "pitta", "kapha"]

export function DoshaSection({ vm }: { vm: ReportViewModel }) {
  const { dosha } = vm
  if (!dosha) return null

  const primary = DOSHA_CONTENT[dosha.primaryDosha]
  const secondary = dosha.secondaryDosha ? DOSHA_CONTENT[dosha.secondaryDosha] : null

  return (
    <Card className="print:break-inside-avoid">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <IconLeaf className="size-5 text-primary" />
          <CardTitle>{secondary ? `${primary.label}–${secondary.label}` : primary.label} Dosha</CardTitle>
          <Badge variant="secondary">Traditional wellness result</Badge>
        </div>
        <CardDescription>{primary.elements}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-sm">
          {DOSHA_ORDER.map((key) => (
            <div key={key} className="rounded-lg border border-border bg-muted/40 p-3">
              <p className="text-xs tracking-wide text-muted-foreground uppercase">{DOSHA_LABELS[key]}</p>
              <p className="font-heading text-lg font-semibold text-foreground">{dosha.breakdown[key]}%</p>
            </div>
          ))}
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Traditional traits associated with {primary.label}</p>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {primary.traits.map((trait) => (
              <li key={trait}>{trait}</li>
            ))}
          </ul>
        </div>

        {secondary ? (
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">
              Also scored close to {secondary.label} — a dual-dosha result is common
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              {secondary.traits.map((trait) => (
                <li key={trait}>{trait}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Traditional Ayurvedic skincare guidance</p>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {primary.skincareGuidance.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
          <IconShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          <p>
            This is traditional Ayurvedic wellness guidance based on your own questionnaire answers — not a medical
            or scientific assessment, not a diagnosis, and not a substitute for professional medical advice. It is
            separate from, and does not replace, your cosmetic AI skin assessment.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
