import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { nextCookies } from "better-auth/next-js"
import { emailOTP } from "better-auth/plugins"

import { prisma } from "@/lib/db"
import { sendOTPEmail } from "@/lib/email/adapter"

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  user: {
    modelName: "User",
    additionalFields: {
      role: {
        type: ["USER", "ADMIN", "OWNER", "SUPPORT", "PRIVACY"],
        input: false,
        defaultValue: "USER",
      },
    },
  },
  session: {
    modelName: "AuthSession",
  },
  account: {
    modelName: "AuthAccount",
    fields: { password: "passwordHash" },
  },
  verification: {
    modelName: "AuthVerification",
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        if (type !== "sign-in") return

        // Not awaited: avoids leaking send-time timing signals to the caller.
        void sendOTPEmail(email, otp).catch((error) => {
          console.error(`[auth] failed to send sign-in OTP to ${email}:`, error)
        })
      },
    }),
    nextCookies(),
  ],
})
