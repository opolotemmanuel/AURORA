import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const from = process.env.EMAIL_FROM ?? "Aura <onboarding@resend.dev>"

type OtpType = "sign-in" | "email-verification" | "forget-password" | "change-email"

function subjectForType(type: OtpType): string {
  switch (type) {
    case "sign-in":
      return "Your Aura sign-in code"
    case "email-verification":
      return "Verify your Aura email"
    case "forget-password":
      return "Reset your Aura password"
    case "change-email":
      return "Confirm your new Aura email"
    default:
      return "Your Aura verification code"
  }
}

function bodyForType(type: OtpType, otp: string): string {
  const intro =
    type === "forget-password"
      ? "Use this code to reset your password:"
      : type === "email-verification"
        ? "Use this code to verify your email:"
        : "Use this code to sign in to Aura:"

  return `${intro}\n\n${otp}\n\nThis code expires in 10 minutes. If you did not request this, you can ignore this email.\n\n— Aura (cosmetic wellness guidance only; not a medical diagnosis)`
}

export async function sendOtpEmail({
  email,
  otp,
  type,
}: {
  email: string
  otp: string
  type: OtpType
}): Promise<void> {
  if (!resend) {
    console.info(`[dev] OTP for ${email} (${type}): ${otp}`)
    return
  }

  await resend.emails.send({
    from,
    to: email,
    subject: subjectForType(type),
    text: bodyForType(type, otp),
  })
}
