import { LandingFooter } from "@/components/marketing/landing-footer"
import { DeletionRequestForm } from "@/components/marketing/deletion-request-form"
import { getSession } from "@/lib/auth/session"

export default async function DataDeletionPage() {
  const session = await getSession()

  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-16">
        <header className="mb-10 space-y-3">
          <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            Privacy
          </p>
          <h1 className="font-heading text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
            Request data deletion
          </h1>
          <p className="text-muted-foreground text-sm">
            Ask us to delete all personal data associated with your account.
          </p>
        </header>

        <div className="text-muted-foreground mb-10 space-y-4 text-sm leading-relaxed">
          <p>
            You have the right to request deletion of your personal data. If you
            are signed in, you can also delete data instantly from your dashboard
            without waiting for a support response.
          </p>
          <p>
            Submit the form below and we will confirm by email. For urgent
            requests, contact{" "}
            <a
              href="mailto:hello@auroraorganics.com"
              className="text-foreground underline underline-offset-4"
            >
              hello@auroraorganics.com
            </a>
            .
          </p>
        </div>

        <DeletionRequestForm
          defaultEmail={session?.user.email ?? ""}
          isLoggedIn={Boolean(session)}
        />
      </article>
      <LandingFooter />
    </>
  )
}
