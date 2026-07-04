import { LandingBenefits } from "@/components/marketing/landing-benefits"
import { LandingCta } from "@/components/marketing/landing-cta"
import { LandingFaq } from "@/components/marketing/landing-faq"
import { LandingFooter } from "@/components/marketing/landing-footer"
import { LandingHero } from "@/components/marketing/landing-hero"
import { LandingHowItWorks } from "@/components/marketing/landing-how-it-works"
import { LandingTestimonials } from "@/components/marketing/landing-testimonials"

export function LandingPageContent() {
  return (
    <div className="flex flex-col">
      <LandingHero />
      <LandingBenefits />
      <LandingHowItWorks />
      <LandingTestimonials />
      <LandingFaq />
      <LandingCta />
      <LandingFooter />
    </div>
  )
}
