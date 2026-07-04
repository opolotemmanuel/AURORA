import { FAQ3 } from "@/components/ui/faq-3"

const items = [
  {
    question: "Is Aura a medical diagnosis?",
    answer:
      "No. Aura provides cosmetic and wellness guidance only. It uses coarse bands — not clinical precision — and is not a substitute for advice from a licensed healthcare professional.",
  },
  {
    question: "Do you keep my photos?",
    answer:
      "By default, Aura stores your report and assessment data, not your scan photo. You control your data and can delete scans, profile details, or your entire account from the dashboard.",
  },
  {
    question: "What are scan tokens?",
    answer:
      "Each skin scan uses one token from your wallet. New accounts receive a signup bonus. Additional tokens may be granted by admins or through future promotions.",
  },
  {
    question: "How are Aurora products recommended?",
    answer:
      "Recommendations combine your cosmetic assessment bands with your onboarding profile — skin type, routine, lifestyle, and local climate — to suggest Aurora Organics products that may fit your needs.",
  },
  {
    question: "How is my data protected?",
    answer:
      "Data is encrypted in transit and at rest. We collect only what is needed to deliver your report and recommendations. You must provide explicit consent before your first scan.",
  },
]

export function LandingFaq() {
  return (
    <div id="faq">
      <FAQ3
        badge="FAQ"
        heading="Common questions about Aura"
        subheading="Everything you need to know about Aura — personalized guidance, privacy-first by design, and Aurora Organics products chosen for you."
        items={items}
      />
    </div>
  )
}
