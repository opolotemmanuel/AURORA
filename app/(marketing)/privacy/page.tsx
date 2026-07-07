import { LandingFooter } from "@/components/marketing/landing-footer"

export default function PrivacyPage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-10 space-y-3">
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          Legal
        </p>
        <h1 className="font-heading text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
          Privacy policy
        </h1>
        <p className="text-muted-foreground text-sm">Last updated: July 4, 2026</p>
      </header>

      <div className="text-muted-foreground space-y-8 text-sm leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-foreground font-heading text-lg font-medium">
            Overview
          </h2>
          <p>
            Aura is a cosmetic skin intelligence service operated for Aurora
            Organics. This policy explains what we collect, why we collect it,
            and the choices you have. Aura provides wellness and cosmetic
            guidance only — not medical diagnosis or treatment.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-foreground font-heading text-lg font-medium">
            What we collect
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Account information such as email, name, and authentication method.</li>
            <li>Onboarding profile data including skin type, routine, lifestyle, and location for climate-aware guidance.</li>
            <li>Scan metadata and cosmetic assessment results stored in your report.</li>
            <li>Usage data such as scan allowance activity and scan history.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-foreground font-heading text-lg font-medium">
            Photos and scans
          </h2>
          <p>
            By default, Aura is designed to store your assessment report, not
            your scan photo. You must provide explicit consent before your first
            scan. You may delete scans, profile data, or your entire account from
            the dashboard at any time.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-foreground font-heading text-lg font-medium">
            How we use data
          </h2>
          <p>
            We use your information to deliver cosmetic assessments, generate
            personalized Aurora product recommendations, maintain your account,
            and improve service quality. We do not sell your personal data.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-foreground font-heading text-lg font-medium">
            Security
          </h2>
          <p>
            Data is encrypted in transit and at rest. Access is limited to what
            is required to operate the service. No system is perfectly secure;
            contact us if you believe your account has been compromised.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-foreground font-heading text-lg font-medium">
            Your rights
          </h2>
          <p>
            You can access, correct, export, or delete your data through account
            settings. Linked sign-in methods (email, password, Google) resolve
            to a single account when the email address matches. To request
            deletion by email, use our{" "}
            <a
              href="/privacy/data-deletion"
              className="text-foreground underline underline-offset-4"
            >
              data deletion request form
            </a>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-foreground font-heading text-lg font-medium">
            Contact
          </h2>
          <p>
            Questions about this policy? Email{" "}
            <a
              href="mailto:hello@auroraorganics.com"
              className="text-foreground underline underline-offset-4"
            >
              hello@auroraorganics.com
            </a>
            .
          </p>
        </section>
      </div>
      </article>
      <LandingFooter />
    </>
  )
}
