import { LandingBenefits } from "@/components/marketing/landing-benefits"
import { LandingCta } from "@/components/marketing/landing-cta"
import { LandingFaq } from "@/components/marketing/landing-faq"
import { LandingHero } from "@/components/marketing/landing-hero"
import { LandingHowItWorks } from "@/components/marketing/landing-how-it-works"

export function LandingPageContent() {
  return (
    <div className="flex flex-col">
      <LandingHero />
      <LandingBenefits />
      <LandingHowItWorks />
      <LandingCta />
      <LandingFaq />
    </div>
  )
}
