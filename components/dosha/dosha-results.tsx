import Link from "next/link"
import { IconLeaf, IconShieldCheck, IconSparkles } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DOSHA_CONTENT, DOSHA_LABELS } from "@/lib/dosha/dosha-content"
import type { Dosha } from "@/lib/dosha/questions"
import type { StoredDoshaProfile } from "@/lib/dosha/dosha-store"

export function DoshaResults({ profile }: { profile: StoredDoshaProfile }) {
  const primary = DOSHA_CONTENT[profile.primaryDosha]
  const secondary = profile.secondaryDosha ? DOSHA_CONTENT[profile.secondaryDosha] : null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <IconLeaf className="size-5 text-primary" />
            <CardTitle className="text-2xl">
              {secondary ? `${primary.label}–${secondary.label}` : primary.label}
            </CardTitle>
            <Badge variant="secondary">Traditional wellness result</Badge>
          </div>
          <CardDescription>{primary.elements}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <BreakdownBars breakdown={profile.breakdown} />

          <div>
            <p className="mb-2 text-sm font-medium">Traditional traits associated with {primary.label}</p>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              {primary.traits.map((trait) => (
                <li key={trait}>{trait}</li>
              ))}
            </ul>
          </div>

          {secondary ? (
            <div>
              <p className="mb-2 text-sm font-medium">
                You also scored close to {secondary.label} — a dual-dosha result is common
              </p>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                {secondary.traits.map((trait) => (
                  <li key={trait}>{trait}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconSparkles className="size-5 text-primary" />
            <CardTitle>Traditional Ayurvedic skincare guidance</CardTitle>
          </div>
          <CardDescription>
            General, traditional guidance associated with {primary.label} — not personalized medical advice.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {primary.skincareGuidance.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/50 p-5 text-sm text-muted-foreground">
        <IconShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
        <p>
          This is traditional Ayurvedic wellness guidance based on your own questionnaire answers — not a medical or
          scientific assessment, not a diagnosis, and not a substitute for professional medical advice. It is
          separate from, and does not replace, your cosmetic AI skin assessment.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          Last updated {new Date(profile.updatedAt).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}
        </p>
        <Button asChild variant="outline">
          <Link href="/dosha-assessment?retake=1">Retake the questionnaire</Link>
        </Button>
      </div>
    </div>
  )
}

const DOSHA_ORDER: Dosha[] = ["vata", "pitta", "kapha"]

function BreakdownBars({ breakdown }: { breakdown: Record<Dosha, number> }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Your balance</p>
      {DOSHA_ORDER.map((dosha) => (
        <div key={dosha} className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{DOSHA_LABELS[dosha]}</span>
            <span>{breakdown[dosha]}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.min(100, Math.max(0, breakdown[dosha]))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
