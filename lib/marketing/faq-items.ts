export interface MarketingFaqItem {
  question: string
  answer: string
}

export const MARKETING_FAQ_ITEMS: MarketingFaqItem[] = [
  {
    question: "How does a scan work?",
    answer:
      "Snap a photo or go live. On-device checks confirm lighting and framing, then you get a plain-language skin report with Aurora matches in seconds.",
  },
  {
    question: "Is this a medical diagnosis?",
    answer:
      "No. This is cosmetic and wellness guidance only. Results use simple bands, not clinical scores, and are not a substitute for professional care.",
  },
  {
    question: "Is my photo sent to AI?",
    answer:
      "Yes. Your cropped photo goes to Google Gemini for cosmetic analysis. We do not store the photo by default—only the text assessment is saved.",
  },
  {
    question: "Do you keep my photos?",
    answer:
      "No. By default we keep your report, not your photo. You can delete scans, profile data, or your account anytime from the dashboard.",
  },
  {
    question: "What are scan tiers?",
    answer:
      "Starter, Thinking, and Pro. Starter covers still scans with three free on signup. Thinking goes deeper. Pro adds live camera scans. Each saved analysis uses one scan.",
  },
  {
    question: "How do scan allowances work?",
    answer:
      "One successful analysis uses one scan from your balance. New accounts get three free Starter scans. More can be added by tier when billing ships.",
  },
  {
    question: "What do the skin bands mean?",
    answer:
      "Clear labels for hydration, tone, texture, and more. Easy to read, honest about what a photo can tell you—no fake percentages.",
  },
  {
    question: "How are products recommended?",
    answer:
      "Your scan plus your profile (allergies, routine, climate) filter Aurora Organics formulas that fit you.",
  },
  {
    question: "Can I download my report?",
    answer:
      "Yes. Open any saved report in your dashboard and download a text-only PDF. No photo is included.",
  },
  {
    question: "How is my data protected?",
    answer:
      "Encrypted in transit and at rest. We collect only what the report needs. Explicit consent is required before your first scan.",
  },
]
