// Only route in the (marketing) group — it alone owns "/" (see AGENTS.md's
// route-group table).
import { LandingPageContent } from "@/components/marketing/landing-page-content"

export default function LandingPage() {
  return <LandingPageContent />
}
