// Deterministic, rule-based dosha scoring — no AI call, mirrors the same
// "plain tally, no invented precision" principle as
// lib/recommendations/recommendation-engine.ts's rule-based product
// scoring. Input is one answer per question in DOSHA_QUESTIONS; output is a
// primary dosha, an optional secondary, and a percentage breakdown.
import { DOSHA_QUESTIONS, type Dosha } from "./questions"

export type DoshaBreakdown = Record<Dosha, number>

export type DoshaResult = {
  primary: Dosha
  secondary: Dosha | null
  breakdown: DoshaBreakdown
}

// Fixed tie-break order — traditional listing order (Vata, Pitta, Kapha) —
// used only when two doshas tie for a rank, so the result is deterministic
// rather than depending on object key iteration order.
const DOSHA_ORDER: Dosha[] = ["vata", "pitta", "kapha"]

export function scoreDosha(answers: Record<string, Dosha>): DoshaResult {
  const counts: Record<Dosha, number> = { vata: 0, pitta: 0, kapha: 0 }

  for (const question of DOSHA_QUESTIONS) {
    const answer = answers[question.id]
    if (answer) counts[answer] += 1
  }

  const totalAnswered = DOSHA_QUESTIONS.filter((q) => answers[q.id]).length || 1
  const breakdown = Object.fromEntries(
    DOSHA_ORDER.map((dosha) => [dosha, Math.round((counts[dosha] / totalAnswered) * 100)])
  ) as DoshaBreakdown

  const ranked = [...DOSHA_ORDER].sort((a, b) => counts[b] - counts[a] || DOSHA_ORDER.indexOf(a) - DOSHA_ORDER.indexOf(b))
  const primary = ranked[0]
  const runnerUp = ranked[1]

  // A secondary dosha is only reported when it's genuinely close behind the
  // primary (traditional dual-dosha constitutions, e.g. Vata-Pitta) — not
  // whenever there's simply a second-highest count. "Close" here means the
  // runner-up scored at least 70% of the primary's tally; below that, the
  // result reads as a single dominant dosha. This 70% line is this app's own
  // interpretive cutoff, not a traditional rule — documented here since it's
  // a judgment call.
  const secondary = counts[primary] > 0 && counts[runnerUp] >= counts[primary] * 0.7 && counts[runnerUp] > 0
    ? runnerUp
    : null

  return { primary, secondary, breakdown }
}

export function isCompleteAnswerSet(answers: Record<string, Dosha | undefined>): answers is Record<string, Dosha> {
  return DOSHA_QUESTIONS.every((q) => Boolean(answers[q.id]))
}
