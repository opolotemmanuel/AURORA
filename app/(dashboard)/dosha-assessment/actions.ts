"use server"

// Submits the dosha questionnaire. Re-checks the session here (not just in
// the page that renders the form) since server actions are callable
// directly — same reasoning as app/(dashboard)/settings/product-actions.ts.
// Scores server-side from the raw per-question answers rather than trusting
// a client-computed result, then upserts (never duplicates) the user's
// DoshaProfile row.
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getSession } from "@/lib/auth/session"
import { saveDoshaProfile } from "@/lib/dosha/dosha-store"
import { DOSHA_QUESTIONS, type Dosha } from "@/lib/dosha/questions"
import { isCompleteAnswerSet, scoreDosha } from "@/lib/dosha/scoring"

const DOSHA_VALUES: Dosha[] = ["vata", "pitta", "kapha"]

export async function submitDoshaAssessment(formData: FormData) {
  const session = await getSession()
  if (!session) {
    redirect("/login")
  }

  const answers: Record<string, Dosha | undefined> = {}
  for (const question of DOSHA_QUESTIONS) {
    const value = formData.get(question.id)
    if (typeof value === "string" && DOSHA_VALUES.includes(value as Dosha)) {
      answers[question.id] = value as Dosha
    }
  }

  if (!isCompleteAnswerSet(answers)) {
    throw new Error("Please answer every question before submitting.")
  }

  const result = scoreDosha(answers)
  await saveDoshaProfile(session.user.id, result)

  revalidatePath("/dosha-assessment")
  redirect("/dosha-assessment")
}
