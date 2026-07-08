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

function getClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  return new Resend(apiKey)
}

export async function sendOTPEmail(to: string, code: string): Promise<void> {
  const client = getClient()

  if (!client) {
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
    throw new EmailSendError(error.message ?? "Resend failed to send the OTP email", error.name)
  }
}
