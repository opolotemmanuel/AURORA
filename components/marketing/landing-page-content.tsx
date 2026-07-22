import { IconCircleCheck } from "@tabler/icons-react"

import { LandingBenefits } from "@/components/marketing/landing-benefits"
import { LandingCta } from "@/components/marketing/landing-cta"
import { LandingFaq } from "@/components/marketing/landing-faq"
import { LandingFooter } from "@/components/marketing/landing-footer"
import { LandingHero } from "@/components/marketing/landing-hero"
import { LandingHowItWorks } from "@/components/marketing/landing-how-it-works"
import { LandingTestimonials } from "@/components/marketing/landing-testimonials"

// RECONSTRUCTED, not ported from review (which has no equivalent): this
// project's own pre-existing landing page showed a confirmation banner when
// redirected here after account deletion (see
// components/account/delete-account-section.tsx's POST_DELETE_REDIRECT =
// "/?accountDeleted=1"). That prior implementation had uncommitted local
// changes that were lost when this file was replaced wholesale during the
// review-branch landing page swap — this banner is a best-effort rebuild of
// the same behavior, not a recovery of the original code.
export function LandingPageContent({ accountDeleted = false }: { accountDeleted?: boolean }) {
  return (
    <div className="flex flex-col">
      {accountDeleted ? (
        <p
          role="status"
          className="flex items-center justify-center gap-2 border-b border-primary/30 bg-primary/10 px-4 py-3 text-center text-sm text-primary"
        >
          <IconCircleCheck className="size-4 shrink-0" />
          Your account has been deleted.
        </p>
      ) : null}
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
