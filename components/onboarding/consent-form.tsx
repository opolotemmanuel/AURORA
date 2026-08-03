"use client"

// Real, one-time consent + location request — shown once per account,
// right after signup (or on an existing account's first /scan visit, via
// the ?next=/scan redirect app/(scan)/scan/page.tsx sends here). Consent
// itself is required to proceed past this screen (the "Continue" button
// stays disabled until checked); location is requested here too but never
// blocks proceeding if declined — an account with no location grant yet
// just can't complete a scan until it grants one, enforced by the scan
// page's own silent re-check + failure banner (components/scan/
// ScanFlow.tsx), not by this screen.
import { useState } from "react"
import { useRouter } from "next/navigation"
import { IconAlertCircle, IconLoader2, IconMapPin, IconShieldCheck } from "@tabler/icons-react"

import { recordScanConsent } from "@/app/(onboarding)/onboarding/consent/actions"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { requestGeolocation } from "@/lib/scan/geolocation"

export function OnboardingConsentForm({ nextPath }: { nextPath: string }) {
  const router = useRouter()
  const [consentChecked, setConsentChecked] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onContinue() {
    if (!consentChecked || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    // Fires the browser's real permission prompt now, while we have the
    // user's attention. The result is intentionally not branched on here —
    // declining must not block account setup. If it's declined (or this
    // browser/connection can't support it), the scan page's own silent
    // per-visit re-check picks that up later and blocks capture there
    // instead, with its own honest explanation.
    await requestGeolocation()

    const result = await recordScanConsent()
    setIsSubmitting(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    router.push(nextPath)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <IconShieldCheck className="mx-auto size-8 text-primary" />
        <h1 className="text-xl font-medium">Before your first scan</h1>
        <p className="text-sm text-muted-foreground">
          Two quick things, both one-time — you won&apos;t be asked again.
        </p>
      </div>

      <div className="space-y-3">
        <label className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 text-sm">
          <Checkbox
            checked={consentChecked}
            onCheckedChange={(checked) => setConsentChecked(checked === true)}
            className="mt-0.5"
          />
          <span className="leading-6 text-foreground">
            I understand and agree to cosmetic skin scans on this account. Each scan&apos;s image is reviewed
            only after I capture or upload it, and every result is cosmetic wellness guidance only — never a
            medical diagnosis. This is a one-time acknowledgment covering all future scans on this account; I
            won&apos;t be asked again.
          </span>
        </label>

        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">
          <IconMapPin className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            Scanning uses your local weather to fine-tune recommendations, so it needs location access.
            Continuing will ask your browser for permission now. Declining won&apos;t stop your account from
            being created — but you&apos;ll need to grant it before you can complete a scan.
          </span>
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <IconAlertCircle className="size-4 shrink-0" />
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        className="w-full"
        disabled={!consentChecked || isSubmitting}
        onClick={() => void onContinue()}
      >
        {isSubmitting ? <IconLoader2 className="size-4 animate-spin" /> : null}
        Continue
      </Button>
    </div>
  )
}
