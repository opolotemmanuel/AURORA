// Stub step 1 of 3 (see also consent/page.tsx and profile/page.tsx) — no
// real onboarding logic yet, and nothing in the app currently links here
// (login/verify go straight to /dashboard), so this flow is only reachable
// by navigating to the URL directly.
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function OnboardingPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-medium">Welcome to Aura</h1>
        <p className="text-sm text-muted-foreground">Let&apos;s get you set up.</p>
      </div>
      <Button asChild>
        <Link href="/onboarding/consent">Continue</Link>
      </Button>
    </div>
  )
}
