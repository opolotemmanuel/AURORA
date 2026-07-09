// Stub step 3 of 3 — see the note in ../page.tsx.
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function OnboardingProfilePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-medium">Your profile</h1>
        <p className="text-sm text-muted-foreground">Profile setup placeholder.</p>
      </div>
      <Button asChild>
        <Link href="/dashboard">Finish</Link>
      </Button>
    </div>
  )
}
