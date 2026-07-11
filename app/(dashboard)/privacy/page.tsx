// New route per this pass's sidebar spec. Self-service only — the
// retention summary below restates the privacy commitments already made in
// AGENTS.md's Non-Negotiables (minimal retention, encryption, a real delete
// path); it doesn't introduce any new policy. The delete/data actions reuse
// ManageYourDataCard so this page and /account's "Your data" tab never
// drift apart on what "manage your data" actually offers.
import { IconLock, IconPhoto, IconShieldCheck } from "@tabler/icons-react"

import { ManageYourDataCard } from "@/components/account/manage-your-data-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl space-y-8">
      <section className="space-y-2">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase">
          <IconShieldCheck className="size-4" />
          Privacy
        </p>
        <h1 className="text-3xl font-semibold tracking-normal">Privacy & data</h1>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">
          How your data is handled — and how to manage or remove it.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>What we keep</CardTitle>
          <CardDescription>Cosmetic and wellness guidance only — not a medical diagnosis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted p-4">
            <IconPhoto className="mt-0.5 size-5 shrink-0 text-primary" />
            <p className="text-sm text-muted-foreground">
              Your scan photo itself is not stored by default — only the generated report and findings are kept.
            </p>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted p-4">
            <IconLock className="mt-0.5 size-5 shrink-0 text-primary" />
            <p className="text-sm text-muted-foreground">
              Data is encrypted in transit and at rest, and scoped to your own account — no one else can see it.
            </p>
          </div>
        </CardContent>
      </Card>

      <ManageYourDataCard />
    </div>
  )
}
