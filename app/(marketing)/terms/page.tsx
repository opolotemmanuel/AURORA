import Link from "next/link"

import { LandingFooter } from "@/components/marketing/landing-footer"

export default function TermsPage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-16">
        <header className="mb-10 space-y-3">
          <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            Legal
          </p>
          <h1 className="font-heading text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
            Terms of use
          </h1>
          <p className="text-muted-foreground text-sm">Last updated: July 8, 2026</p>
        </header>

        <div className="text-muted-foreground space-y-8 text-sm leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-foreground font-heading text-lg font-medium">
              Acceptance
            </h2>
            <p>
              By accessing or using Aura, you agree to these terms. If you do not
              agree, do not use the service. Aura is provided by Aurora Organics
              for cosmetic and wellness purposes only. Your use of Aura is also
              governed by our{" "}
              <Link
                href="/privacy"
                className="text-foreground underline underline-offset-4"
              >
                privacy policy
              </Link>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground font-heading text-lg font-medium">
              Not medical advice
            </h2>
            <p>
              Aura outputs cosmetic guidance in coarse bands. It does not diagnose,
              treat, or prevent disease. Always consult a qualified healthcare
              professional for medical skin concerns.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground font-heading text-lg font-medium">
              Accounts
            </h2>
            <p>
              You are responsible for your account credentials and activity. You
              may sign in with email and password, email one-time code, or linked
              social providers (Google and Apple, where available). Accounts
              sharing the same verified email may be linked automatically.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground font-heading text-lg font-medium">
              Scan tiers and allowances
            </h2>
            <p>
              Aura offers three scan tiers: Starter, Thinking, and Pro. Each
              successful analysis consumes one allowance from your active tier.
              New accounts receive three free Starter scans.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-foreground">Starter</strong> — still-photo
                scans using the Starter model.
              </li>
              <li>
                <strong className="text-foreground">Thinking</strong> — still-photo
                scans using the Thinking model with deeper analysis.
              </li>
              <li>
                <strong className="text-foreground">Pro</strong> — still-photo
                scans plus live camera scans with real-time AI analysis.
              </li>
            </ul>
            <p>
              Additional scans may be purchased by tier when billing is available.
              Changing tiers replaces your remaining allowance with the new tier
              pack size; unused scans on the previous tier are forfeited.
              Allowances have no cash value and are non-transferable unless
              explicitly stated otherwise.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground font-heading text-lg font-medium">
              Live scan
            </h2>
            <p>
              Live scan is available on the Pro tier only. Video frames stream
              from your browser to Google for real-time cosmetic analysis. Live
              scan output is cosmetic guidance only — not a medical diagnosis. You
              must not scan other people without their consent.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground font-heading text-lg font-medium">
              Acceptable use
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>Do not misuse the service, attempt unauthorized access, or interfere with other users.</li>
              <li>Do not submit content you do not have rights to use.</li>
              <li>Do not scan other people without their explicit consent.</li>
              <li>Do not rely on Aura for emergency or clinical decisions.</li>
              <li>Do not misrepresent or misuse AI-generated output.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground font-heading text-lg font-medium">
              Product recommendations
            </h2>
            <p>
              Aurora product suggestions are informational and based on your profile
              and assessment. Individual results vary. Patch-test new products and
              follow product labeling.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground font-heading text-lg font-medium">
              Termination
            </h2>
            <p>
              You may delete your account at any time from dashboard privacy
              settings. Aurora Organics may suspend or terminate accounts that
              violate these terms or misuse the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground font-heading text-lg font-medium">
              Limitation of liability
            </h2>
            <p>
              Aura is provided &quot;as is&quot; to the fullest extent permitted by
              law. Aurora Organics is not liable for indirect or consequential
              damages arising from use of the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground font-heading text-lg font-medium">
              Changes
            </h2>
            <p>
              We may update these terms. Continued use after changes constitutes
              acceptance. Material changes will be reflected on this page.
            </p>
          </section>
        </div>

        <p className="text-muted-foreground mt-12 text-sm">
          <Link
            href="/privacy"
            className="text-foreground underline underline-offset-4"
          >
            Privacy policy
          </Link>
        </p>
      </article>
      <LandingFooter />
    </>
  )
}
