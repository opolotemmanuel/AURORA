// Single server-side better-auth instance for the whole app (see
// lib/auth/client.ts for the browser-side counterpart, and
// lib/auth/session.ts for the thin server-component helper built on top).
//
// No explicit `baseURL` here: better-auth falls back to reading
// BETTER_AUTH_URL from the environment, which is deliberately the one
// canonical URL (https://aurora-5spm.vercel.app in production) — it's
// what password-reset/verification links and any absolute-URL-building
// use as "home," never whichever alias a request happened to arrive on.
//
// `trustedOrigins` below is additive on top of that: better-auth already
// auto-trusts whatever origin BETTER_AUTH_URL resolves to, so this only
// needs to cover this same Vercel project's *other* valid aliases (the
// git-branch alias, the per-deployment unique URL, etc.) — scoped to this
// project's own name rather than a blanket "*.vercel.app" so unrelated
// Vercel-hosted apps can't pass this app's origin checks. See
// better-auth.com/docs/guides/dynamic-base-url for the wildcard pattern.
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { nextCookies } from "better-auth/next-js"

import { prisma } from "@/lib/db"
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email/adapter"
import { deleteAllScansForUser, saveAuditLog } from "@/lib/backend/report-store"
import { grantSignupScans } from "@/lib/scans/balance"

// Apple is only registered if all three env vars are present — better-auth
// treats every socialProviders key as optional, so omitting `apple` entirely
// (rather than passing undefined fields) is the correct way to make it
// absent until real credentials are configured.
const appleClientId = process.env.APPLE_CLIENT_ID
const appleClientSecret = process.env.APPLE_CLIENT_SECRET

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  trustedOrigins: ["https://aurora-5spm-*.vercel.app"],
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
    // Powers the real self-service "Delete your account" flow on /account
    // (components/account/delete-account-section.tsx) — disabled by
    // default in better-auth, so this has to be turned on explicitly.
    // Requires the client to pass `password`, which the /delete-user
    // endpoint verifies server-side against the real AuthAccount hash
    // before anything runs (see node_modules/better-auth's
    // dist/api/routes/update-user.mjs) — this app never calls
    // authClient.deleteUser() without a password, so the request is always
    // independently re-verified, never trusted from client state alone.
    deleteUser: {
      enabled: true,
      // Scan/Report rows use `onDelete: SetNull` on their User relation
      // (not Cascade — see prisma/schema.prisma's comments), so without
      // this they'd survive as orphans once the User row is gone.
      // deleteAllScansForUser cascades Report/ReportFinding/Recommendation/
      // ReportChatMessage/ReportDownload/AiProviderEvent away first; the
      // User row's own Cascade relations (AuthAccount, AuthSession,
      // SkinAdviceMessage, DoshaProfile, any remaining ReportChatMessage)
      // are handled automatically right after this hook returns, by
      // better-auth's own internalAdapter.deleteUser call.
      beforeDelete: async (user) => {
        await deleteAllScansForUser(user.id)
        await saveAuditLog({
          actorId: user.id,
          action: `Deleted own account (${user.email})`,
          targetType: "admin",
          targetId: user.id,
        })
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
    // TODO(revisit): re-enable once a verified sending domain exists in
    // Resend. Currently false as a deliberate, temporary product decision —
    // Resend's sandbox mode can only deliver to the account owner's own
    // address, so requiring verification blocked every other sign-up from
    // ever completing. See the emailVerification block below too.
    requireEmailVerification: false,
    // register-form.tsx now redirects straight to /dashboard on success —
    // this makes signUp.email itself start that session.
    autoSignIn: true,
    revokeSessionsOnPasswordReset: true,
    async sendResetPassword({ user, url }) {
      await sendPasswordResetEmail(user.email, url)
    },
  },
  emailVerification: {
    // TODO(revisit): flip back to true alongside requireEmailVerification
    // above once verification emails can actually be delivered. false for
    // now — sending a link nobody needs (and that would fail to deliver
    // anyway) is just noise.
    sendOnSignUp: false,
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
    user: {
      create: {
        // Fires exactly once per new account (email/password sign-up or a
        // brand-new social sign-in alike — both create a User row through
        // this same internal adapter path), so this is the one place that
        // grants the starter scan balance regardless of provider. Existing
        // users from before this feature are covered separately by the
        // one-time backfill script (scripts/backfill-scan-credits.ts), not
        // this hook.
        async after(user) {
          await grantSignupScans(user.id)
        },
      },
    },
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
