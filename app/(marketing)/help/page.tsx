import Link from "next/link"

import { LandingFooter } from "@/components/marketing/landing-footer"
import { FAQ3 } from "@/components/ui/faq-3"
import { MARKETING_FAQ_ITEMS } from "@/lib/marketing/faq-items"

export default function HelpPage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-16">
        <header className="mb-10 space-y-3">
          <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            Support
          </p>
          <h1 className="font-heading text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
            Help center
          </h1>
          <p className="text-muted-foreground text-sm">
            Answers about Aura, your account, and your data.
          </p>
        </header>

        <div className="text-muted-foreground space-y-10 text-sm leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-foreground font-heading text-lg font-medium">
              Getting started
            </h2>
            <p>
              Create an account, complete onboarding, then start a scan from{" "}
              <Link href="/scan" className="text-foreground underline underline-offset-4">
                /scan
              </Link>
              . You can upload a photo or use your camera. On-device checks help
              ensure good lighting and framing before analysis. Each scan uses one
              token from your wallet; your report is saved to your dashboard and
              can be downloaded as a PDF.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground font-heading text-lg font-medium">
              Account &amp; onboarding
            </h2>
            <p>
              Sign in with email and password, a one-time code, or Google. After
              your first sign-in, onboarding collects your skin profile, routine,
              and optional location for climate-aware guidance. You can update
              profile details anytime from your dashboard settings.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground font-heading text-lg font-medium">
              Privacy &amp; your data
            </h2>
            <p>
              Read our{" "}
              <Link href="/privacy" className="text-foreground underline underline-offset-4">
                privacy policy
              </Link>{" "}
              for full details. Logged-in users can delete scans, profile data, or
              their entire account from{" "}
              <Link
                href="/dashboard/privacy"
                className="text-foreground underline underline-offset-4"
              >
                dashboard privacy settings
              </Link>
              . To request deletion by email, use our{" "}
              <Link
                href="/privacy/data-deletion"
                className="text-foreground underline underline-offset-4"
              >
                data deletion request form
              </Link>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground font-heading text-lg font-medium">
              Contact
            </h2>
            <p>
              Still need help? Email{" "}
              <a
                href="mailto:hello@auroraorganics.com"
                className="text-foreground underline underline-offset-4"
              >
                hello@auroraorganics.com
              </a>{" "}
              and we will get back to you as soon as we can.
            </p>
          </section>
        </div>

        <div className="mt-16">
          <FAQ3
            badge="FAQ"
            heading="Common questions"
            subheading="Quick answers on scans, privacy, your report, and how personalized guidance works."
            items={MARKETING_FAQ_ITEMS}
          />
        </div>
      </article>
      <LandingFooter />
    </>
  )
}
