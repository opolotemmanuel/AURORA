import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { admin, emailOTP, organization } from "better-auth/plugins"

import { prisma } from "@/lib/db/client"
import { sendOtpEmail } from "@/lib/email/send-otp"

export const auth = betterAuth({
  appName: "Aura",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        void sendOtpEmail({ email, otp, type })
      },
      otpLength: 6,
      expiresIn: 60 * 10,
    }),
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
    organization({
      allowUserToCreateOrganization: true,
    }),
  ],
  user: {
    additionalFields: {
      onboardingCompleted: {
        type: "boolean",
        defaultValue: false,
        input: false,
      },
    },
  },
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
