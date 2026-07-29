import { FAQ3 } from "@/components/ui/faq-3"
import { MARKETING_FAQ_ITEMS } from "@/lib/marketing/faq-items"

export function LandingFaq() {
  return (
    <div id="faq">
      <FAQ3 badge="FAQ" heading="Answers before you scan" items={MARKETING_FAQ_ITEMS} />
    </div>
  )
}
