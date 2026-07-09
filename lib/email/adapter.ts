// Email delivery for the auth flows (email verification, password reset),
// backed by Resend. Called from lib/auth/auth.ts's emailAndPassword/
// emailVerification config — kept in its own module so the auth config
// doesn't need to know about a specific email provider.
import { Resend } from "resend"

const FROM_ADDRESS =
  process.env.RESEND_FROM_EMAIL || "Aura <onboarding@resend.dev>"

export class EmailSendError extends Error {
  constructor(
    message: string,
    readonly providerMessage?: string
  ) {
    super(message)
    this.name = "EmailSendError"
  }
}

// Resend client is created lazily (not module-level) so importing this file
// never throws just because RESEND_API_KEY happens to be unset — only
// actually sending an email requires the key.
function getClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  return new Resend(apiKey)
}

export async function sendVerificationEmail(
  to: string,
  url: string
): Promise<void> {
  await send({
    to,
    subject: "Verify your Aura email address",
    text: `Confirm your email to finish setting up your Aura account: ${url}\n\nIf you didn't create an account, you can ignore this email.`,
    html: `<p>Confirm your email to finish setting up your Aura account:</p><p><a href="${url}">${url}</a></p><p>If you didn't create an account, you can ignore this email.</p>`,
    devFallbackLabel: "verification link",
    devFallbackValue: url,
  })
}

export async function sendPasswordResetEmail(
  to: string,
  url: string
): Promise<void> {
  await send({
    to,
    subject: "Reset your Aura password",
    text: `Reset your Aura password: ${url}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`,
    html: `<p>Reset your Aura password:</p><p><a href="${url}">${url}</a></p><p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>`,
    devFallbackLabel: "reset link",
    devFallbackValue: url,
  })
}

async function send(input: {
  to: string
  subject: string
  text: string
  html: string
  devFallbackLabel: string
  devFallbackValue: string
}): Promise<void> {
  const client = getClient()

  if (!client) {
    // No API key configured. In production that's a real misconfiguration
    // and must fail loudly; in development it's expected (no key set up
    // yet), so fall back to logging the link so the flow can still be tested.
    if (process.env.NODE_ENV === "production") {
      throw new EmailSendError(
        "RESEND_API_KEY is not configured — cannot send email in production."
      )
    }

    console.log(
      `[email] RESEND_API_KEY not set — dev fallback, ${input.devFallbackLabel} for ${input.to}: ${input.devFallbackValue}`
    )
    return
  }

  const { error } = await client.emails.send({
    from: FROM_ADDRESS,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  })

  if (error) {
    // Resend's test/sandbox API keys can only send to the account owner's
    // own verified address — sending to any other recipient lands here
    // with a "You can only send testing emails to..." message, not a
    // network/config failure.
    throw new EmailSendError(
      error.message ?? "Resend failed to send the email",
      error.name
    )
  }
}
