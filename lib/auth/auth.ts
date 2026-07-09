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

import { prisma } from "@/lib/db"
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email/adapter"

// Apple is only registered if all three env vars are present — better-auth
// treats every socialProviders key as optional, so omitting `apple` entirely
// (rather than passing undefined fields) is the correct way to make it
// absent until real credentials are configured.
const appleClientId = process.env.APPLE_CLIENT_ID
const appleClientSecret = process.env.APPLE_CLIENT_SECRET

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
      // Must be declared here (not just in prisma/schema.prisma) or
      // better-auth's adapter layer silently drops it from update() calls —
      // it only forwards fields it knows about. Stamped by the
      // databaseHooks.session.create.after hook below.
      lastLoginAt: {
        type: "date",
        input: false,
        required: false,
      },
    },
  },
  // Custom Prisma model names (AuthSession/AuthAccount/AuthVerification)
  // so better-auth's tables don't collide with the app's own `User` model
  // or naming conventions in prisma/schema.prisma.
  session: {
    modelName: "AuthSession",
    // better-auth has no separate refresh-token type — one session token,
    // renewed on a sliding window. These are its own defaults, made
    // explicit since the spec calls out "automatic session expiration" and
    // "automatic token refresh" as requirements: a session is valid for
    // expiresIn, and any use past updateAge before that pushes expiresAt
    // forward by expiresIn again.
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  account: {
    modelName: "AuthAccount",
    fields: { password: "passwordHash" },
  },
  verification: {
    modelName: "AuthVerification",
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: true,
    // register-form.tsx shows a "check your email" screen and sends the
    // user to /login itself — it doesn't expect sign-up to also start a
    // session.
    autoSignIn: false,
    revokeSessionsOnPasswordReset: true,
    async sendResetPassword({ user, url }) {
      await sendPasswordResetEmail(user.email, url)
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    // login-form.tsx shows a "verified — sign in now" banner rather than
    // signing the user in for them.
    autoSignInAfterVerification: false,
    async sendVerificationEmail({ user, url }) {
      await sendVerificationEmail(user.email, url)
    },
  },
  ...(appleClientId && appleClientSecret
    ? {
        socialProviders: {
          apple: {
            clientId: appleClientId,
            clientSecret: appleClientSecret,
            appBundleIdentifier: process.env.APPLE_APP_BUNDLE_IDENTIFIER,
          },
        },
      }
    : {}),
  databaseHooks: {
    session: {
      create: {
        // Fires on every successful sign-in (email/password or social alike
        // — both create a session row), so this is the one place that
        // covers User.lastLoginAt regardless of provider.
        async after(session, context) {
          await context?.context.internalAdapter.updateUser(session.userId, {
            lastLoginAt: new Date(),
          })
        },
      },
    },
  },
  plugins: [
    // Lets server actions/route handlers set the session cookie directly
    // via Next's `cookies()` API instead of returning a Set-Cookie header.
    nextCookies(),
  ],
})
