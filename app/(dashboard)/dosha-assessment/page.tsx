// New route — self-service only, no role check beyond "is signed in"
// (already enforced by the parent (dashboard)/layout.tsx). Scoped exactly
// like /profile and /skin-history: getDoshaProfile is looked up by
// session.user.id server-side, so a user can never see another user's
// dosha profile by construction, not just because the UI hides it.
//
// Deliberately its own page, separate from the cosmetic scan report and
// Skin History (per the spec: "never blend the two into one score") — this
// is a traditional/wellness questionnaire result, not part of the AI
// cosmetic assessment.
import { redirect } from "next/navigation"
import { IconLeaf } from "@tabler/icons-react"

import { DoshaQuestionnaireForm } from "@/components/dosha/dosha-questionnaire-form"
import { DoshaResults } from "@/components/dosha/dosha-results"
import { getSession } from "@/lib/auth/session"
import { getDoshaProfile } from "@/lib/dosha/dosha-store"

export const dynamic = "force-dynamic"

type DoshaAssessmentPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function DoshaAssessmentPage({ searchParams }: DoshaAssessmentPageProps) {
  const params = await searchParams
  const session = await getSession()
  if (!session) {
    // (dashboard)/layout.tsx already redirects when there's no session, but
    // that's a separate, independent getSession() call (a fresh DB
    // round-trip) — under a transient failure the two can disagree, so this
    // page can't just assume the layout's check already covered it.
    redirect("/login")
  }

  const profile = await getDoshaProfile(session.user.id)
  const showForm = !profile || params.retake === "1"

  return (
    <div className="max-w-2xl space-y-8">
      <section className="space-y-2">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase">
          <IconLeaf className="size-4" />
          Dosha Assessment
        </p>
        <h1 className="text-3xl font-semibold tracking-normal">
          {showForm ? "Discover your Ayurvedic dosha" : "Your dosha result"}
        </h1>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">
          A short, traditional Ayurvedic questionnaire — optional, separate from your cosmetic AI skin assessment,
          and framed as traditional wellness guidance, not medical advice.
        </p>
      </section>

      {showForm ? <DoshaQuestionnaireForm /> : <DoshaResults profile={profile} />}
    </div>
  )
}
