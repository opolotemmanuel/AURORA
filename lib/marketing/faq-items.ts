export interface MarketingFaqItem {
  question: string
  answer: string
}

export const MARKETING_FAQ_ITEMS: MarketingFaqItem[] = [
  {
    question: "How does a scan work?",
    answer:
      "Use your camera or upload a photo. On-screen quality checks help you get a clear shot, then you receive a personalized skin report with plain-language insights and product matches, all in seconds.",
  },
  {
    question: "Is this a medical diagnosis?",
    answer:
      "No. This is cosmetic and wellness guidance only. Results use simple skin bands, not clinical precision, and are not a substitute for advice from a licensed healthcare professional.",
  },
  {
    question: "Is my photo sent to AI?",
    answer:
      "Yes. Your cropped photo is sent to Google Gemini for cosmetic analysis. Aura does not store your photo by default — only the text assessment and recommendations are saved. On-device quality checks run locally in your browser and are not sent to our servers.",
  },
  {
    question: "Do you keep my photos?",
    answer:
      "By default, we store your report and assessment data, not your scan photo. You can delete scans, profile details, or your entire account anytime from the dashboard.",
  },
  {
    question: "What are scan tiers?",
    answer:
      "Aura offers Starter, Thinking, and Pro tiers. Starter includes still-photo scans — new accounts get three free Starter scans. Thinking adds deeper AI analysis. Pro adds live camera scans with real-time analysis. Each saved analysis uses one scan allowance.",
  },
  {
    question: "How do scan allowances work?",
    answer:
      "Each saved analysis uses one scan from your tier allowance. New accounts receive three free Starter scans. Additional scans can be purchased by tier when billing is available.",
  },
  {
    question: "What do the skin bands mean?",
    answer:
      "Bands are simple labels for areas like hydration, tone, and texture: easy to read, honest about what the scan can tell you, and meant to guide product choices without fake percentages.",
  },
  {
    question: "How are products recommended?",
    answer:
      "Recommendations combine your scan results with your onboarding profile (skin type, routine, lifestyle, and local climate) to suggest formulas that may fit your needs.",
  },
  {
    question: "Can I download my report?",
    answer:
      "Yes. Saved reports live in your dashboard. Open any report and download a text-only PDF — no photo is included. This is the way to keep or share your assessment results.",
  },
  {
    question: "How is my data protected?",
    answer:
      "Data is encrypted in transit using HTTPS/TLS and stored on encrypted database infrastructure. We only collect what is needed to deliver your report and recommendations. You must give explicit consent before your first scan.",
  },
]
