// Adapted from wyasyn/aura's review branch: dropped the "What are scan
// tiers?" and "How do scan allowances work?" entries — both describe
// review's Starter/Thinking/Pro scan-pack/credit system, which this app
// doesn't have. The rest describes real behavior of this app as-is.
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
      "Yes. Your photo is sent to Google Gemini for cosmetic analysis. Aura does not store your photo by default — only the text assessment and recommendations are saved.",
  },
  {
    question: "Do you keep my photos?",
    answer:
      "By default, we store your report and assessment data, not your scan photo. You can delete scans, profile details, or your entire account anytime from the dashboard.",
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
