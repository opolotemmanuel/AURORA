// Email delivery for the sign-in OTP flow, backed by Resend. Called from
// lib/auth/auth.ts's emailOTP plugin — kept in its own module so the auth
// config doesn't need to know about a specific email provider.
import { Resend } from "resend"

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || "Aura <onboarding@resend.dev>"

export class EmailSendError extends Error {
  constructor(
    message: string,
    readonly providerMessage?: string,
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

export async function sendOTPEmail(to: string, code: string): Promise<void> {
  const client = getClient()

  if (!client) {
    // No API key configured. In production that's a real misconfiguration
    // and must fail loudly; in development it's expected (no key set up
    // yet), so fall back to logging the code so sign-in can still be tested.
    if (process.env.NODE_ENV === "production") {
      throw new EmailSendError("RESEND_API_KEY is not configured — cannot send email in production.")
    }

    console.log(`[email] RESEND_API_KEY not set — dev fallback, OTP for ${to}: ${code}`)
    return
  }

  const { error } = await client.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `${code} is your Aura sign-in code`,
    text: `Your Aura sign-in code is ${code}. It expires in 5 minutes. If you didn't request this, you can ignore this email.`,
    html: `<p>Your Aura sign-in code is:</p><p style="font-size:28px;font-weight:600;letter-spacing:4px;">${code}</p><p>It expires in 5 minutes. If you didn't request this, you can ignore this email.</p>`,
  })

  if (error) {
    // Resend's test/sandbox API keys can only send to the account owner's
    // own verified address — sending to any other recipient lands here
    // with a "You can only send testing emails to..." message, not a
    // network/config failure.
    throw new EmailSendError(error.message ?? "Resend failed to send the OTP email", error.name)
  }
}
