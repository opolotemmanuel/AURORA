import Link from "next/link"

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
          <p className="text-muted-foreground text-sm">Last updated: July 8, 2026</p>
        </header>

        <div className="text-muted-foreground space-y-8 text-sm leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-foreground font-heading text-lg font-medium">
              Overview
            </h2>
            <p>
              Aura is a cosmetic skin intelligence service operated for Aurora
              Organics. This policy explains what we collect, why we collect it,
              how it is processed, and the choices you have. Aura provides
              wellness and cosmetic guidance only — not medical diagnosis or
              treatment.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground font-heading text-lg font-medium">
              What we collect
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-foreground">Account information</strong>{" "}
                — email, name, authentication method, and optional profile image
                from linked sign-in providers.
              </li>
              <li>
                <strong className="text-foreground">Session metadata</strong> —
                IP address and browser user agent stored with your active
                session for security and account management.
              </li>
              <li>
                <strong className="text-foreground">Wellness profile</strong> —
                age band (derived from date of birth), skin type, concerns,
                goals, routine, medications, allergies, and lifestyle factors
                collected during onboarding or updated in settings.
              </li>
              <li>
                <strong className="text-foreground">Location and climate</strong>{" "}
                — city, region, country, coordinates (for geocoding), and derived
                climate bands used for climate-aware guidance.
              </li>
              <li>
                <strong className="text-foreground">Consent records</strong> —
                required photo-processing consent, optional marketing opt-in,
                consent version, and acceptance timestamp.
              </li>
              <li>
                <strong className="text-foreground">Scan results</strong> — coarse
                cosmetic assessment bands, product recommendations, profile and
                location snapshots captured at scan time, and optional scan
                feedback (rating and message).
              </li>
              <li>
                <strong className="text-foreground">Usage data</strong> — scan
                allowance balance and ledger activity (grants, debits, and
                purchases when billing is available).
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground font-heading text-lg font-medium">
              Photos, AI processing, and on-device checks
            </h2>
            <p>
              You must provide explicit consent to photo processing during
              onboarding before your first scan. Here is what happens when you
              scan:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-foreground">On-device quality checks</strong>{" "}
                — MediaPipe runs in your browser to check face framing and
                lighting. These frames stay on your device and are not sent to
                our servers.
              </li>
              <li>
                <strong className="text-foreground">Still scan</strong> — your
                cropped photo is sent to Google Gemini for cosmetic analysis.
                Aura does not store your photo by default; only the text
                assessment and recommendations are saved.
              </li>
              <li>
                <strong className="text-foreground">Live scan (Pro tier)</strong>{" "}
                — video frames stream directly from your browser to Google for
                real-time analysis. The session transcript is not stored; only
                the final assessment is saved.
              </li>
              <li>
                <strong className="text-foreground">Reports</strong> — saved
                assessments can be viewed in your dashboard. Text-only PDF
                reports are generated on demand and do not include your photo.
              </li>
            </ul>
            <p>
              Data sent to Google Gemini is subject to Google&apos;s own privacy
              and retention policies. We do not control how Google processes or
              retains that data.
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
            <p>
              If you opt in to marketing emails during onboarding, we store that
              preference. We do not currently send marketing emails, but you can
              withdraw consent anytime by deleting profile data or updating
              privacy settings.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground font-heading text-lg font-medium">
              Third-party service providers
            </h2>
            <p>
              We use trusted providers to operate Aura. They process data only as
              needed to deliver the service:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-foreground">Google Gemini</strong> — AI
                skin analysis for still and live scans.
              </li>
              <li>
                <strong className="text-foreground">Google and Apple</strong> —
                optional sign-in where configured.
              </li>
              <li>
                <strong className="text-foreground">Resend</strong> — one-time
                login codes and deletion-request emails.
              </li>
              <li>
                <strong className="text-foreground">Neon</strong> — PostgreSQL
                database hosting.
              </li>
              <li>
                <strong className="text-foreground">OpenStreetMap Nominatim</strong>{" "}
                — forward and reverse geocoding for location.
              </li>
              <li>
                <strong className="text-foreground">Open-Meteo</strong> — climate
                data for location-based guidance.
              </li>
              <li>
                <strong className="text-foreground">MediaPipe CDN</strong> —
                on-device face detection models loaded in your browser.
              </li>
              <li>
                <strong className="text-foreground">Vercel</strong> — application
                hosting and delivery.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground font-heading text-lg font-medium">
              Cookies and local storage
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-foreground">Session cookie</strong> —
                essential for keeping you signed in.
              </li>
              <li>
                <strong className="text-foreground">Local preferences</strong>{" "}
                — camera device selection, preview height, and dismissed hints
                stored in your browser for scan convenience.
              </li>
              <li>
                <strong className="text-foreground">Theme preference</strong> —
                light or dark mode stored locally.
              </li>
            </ul>
            <p>
              We do not use advertising or analytics cookies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground font-heading text-lg font-medium">
              Retention
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Profile data, scan results, and reports are kept until you delete
                them or close your account.
              </li>
              <li>
                Scan photos are not retained by Aura by default.
              </li>
              <li>
                PDF reports are generated on demand and are not pre-stored.
              </li>
              <li>
                Email deletion requests are reviewed manually and typically
                processed within 30 days.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground font-heading text-lg font-medium">
              Security
            </h2>
            <p>
              Data is encrypted in transit using HTTPS/TLS. Our database is hosted
              on encrypted infrastructure (Neon). Access is limited to what is
              required to operate the service. No system is perfectly secure;
              contact us if you believe your account has been compromised.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground font-heading text-lg font-medium">
              Your rights
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-foreground">Access and correct</strong>{" "}
                — view and edit your profile in dashboard settings.
              </li>
              <li>
                <strong className="text-foreground">Download reports</strong> —
                download a text-only PDF for each saved scan (no photo included).
              </li>
              <li>
                <strong className="text-foreground">Delete</strong> — remove
                scans, profile data, location, or your entire account from{" "}
                <Link
                  href="/dashboard/privacy"
                  className="text-foreground underline underline-offset-4"
                >
                  dashboard privacy settings
                </Link>
                , or use our{" "}
                <Link
                  href="/privacy/data-deletion"
                  className="text-foreground underline underline-offset-4"
                >
                  data deletion request form
                </Link>
                .
              </li>
            </ul>
            <p>
              Linked sign-in methods (email, password, Google, Apple) resolve to
              a single account when the email address matches.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground font-heading text-lg font-medium">
              Contact
            </h2>
            <p>
              Questions about this policy? Email{" "}
              <a
                href="mailto:info@auroraorganics.co"
                className="text-foreground underline underline-offset-4"
              >
                info@auroraorganics.co
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
