// Single server-side better-auth instance for the whole app (see
// lib/auth/client.ts for the browser-side counterpart, and
// lib/auth/session.ts for the thin server-component helper built on top).
//
// No explicit `baseURL`/`trustedOrigins` here: better-auth falls back to
// reading BETTER_AUTH_URL from the environment as the sole trusted origin.
// That env var must match whatever origin the app is actually served from
// (http://localhost:3000 in local dev) or every request fails origin
// validation with "Invalid origin" — see .env.local.
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
      // Coarse app-level role, read by lib/auth/admin.ts to gate the admin
      // dashboard. Not settable by the client (`input: false`) — only
      // trusted server code / DB migrations should change a user's role.
      role: {
        type: ["USER", "ADMIN", "OWNER", "SUPPORT", "PRIVACY"],
        input: false,
        defaultValue: "USER",
      },
    },
  },
  // Custom Prisma model names (AuthSession/AuthAccount/AuthVerification)
  // so better-auth's tables don't collide with the app's own `User` model
  // or naming conventions in prisma/schema.prisma.
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
    // Email OTP is the only sign-in method — no passwords. This app has no
    // separate "sign-up" flow: a first-time OTP sign-in implicitly creates
    // the user record (better-auth's default emailOTP behavior).
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        if (type !== "sign-in") return

        // Not awaited: avoids leaking send-time timing signals to the caller.
        void sendOTPEmail(email, otp).catch((error) => {
          console.error(`[auth] failed to send sign-in OTP to ${email}:`, error)
        })
      },
    }),
    // Lets server actions/route handlers set the session cookie directly
    // via Next's `cookies()` API instead of returning a Set-Cookie header.
    nextCookies(),
  ],
})
