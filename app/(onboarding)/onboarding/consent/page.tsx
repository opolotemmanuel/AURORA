// Stub step 2 of 3 — see the note in ../page.tsx.
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function OnboardingConsentPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-medium">Consent</h1>
        <p className="text-sm text-muted-foreground">
          Scan and data consent placeholder. Not a medical diagnosis.
        </p>
      </div>
      <Button asChild>
        <Link href="/onboarding/profile">I agree</Link>
      </Button>
    </div>
  )
}
