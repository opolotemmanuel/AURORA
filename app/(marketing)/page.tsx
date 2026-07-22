// Only route in the (marketing) group — it alone owns "/" (see AGENTS.md's
// route-group table). Reads ?accountDeleted=1, set by
// components/account/delete-account-section.tsx's post-deletion redirect,
// to show a real confirmation instead of leaving the user on a broken/
// authenticated-feeling page after their account no longer exists.
import { LandingPageContent } from "@/components/marketing/landing-page-content"

type LandingPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function LandingPage({ searchParams }: LandingPageProps) {
  const params = await searchParams
  return <LandingPageContent accountDeleted={params.accountDeleted === "1"} />
}
