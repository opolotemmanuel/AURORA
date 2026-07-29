/**
 * Substantiated capability claims for the landing page. Every entry maps to a
 * feature that actually ships, so this section can be verified against the
 * codebase rather than asserted. Do not add a claim here without the code
 * behind it.
 */
export interface ProofPoint {
  /** Tabler icon name, resolved by the rendering component. */
  icon: "scan" | "leaf" | "flask" | "cloud" | "lock" | "message" | "report"
  title: string
  description: string
}

export const PROOF_POINTS: ProofPoint[] = [
  {
    icon: "scan",
    title: "Six dimensions, honest bands",
    description:
      "Hydration, tone, texture and more, each reported as a clear band. Never an invented precision score.",
  },
  {
    icon: "leaf",
    title: "Ayurvedic skin lean",
    description:
      "Your scan includes a dosha lean, so guidance reflects a whole-skin picture rather than one symptom.",
  },
  {
    icon: "flask",
    title: "Ingredient-level allergy filtering",
    description:
      "We parse full INCI ingredient lists and filter out matches that conflict with the allergies on your profile.",
  },
  {
    icon: "cloud",
    title: "Matched to your climate",
    description:
      "Recommendations account for the humidity and conditions where you actually live, not a generic average.",
  },
  {
    icon: "lock",
    title: "Photos are never stored",
    description:
      "Your photo is analysed and then discarded. You keep the report, we keep no image.",
  },
  {
    icon: "message",
    title: "Ask follow-up questions",
    description:
      "Talk through your results by voice or text, and get answers grounded in your own scan.",
  },
]

export const PROOF_SECTION = {
  badge: "What you get",
  heading: "Guidance you can check, not just trust",
  subheading:
    "Every claim below maps to something the scan actually does. No fake precision, no borrowed credibility.",
}
