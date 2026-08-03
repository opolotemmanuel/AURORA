import pg from "pg"
import crypto from "node:crypto"

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect()

function id(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

const userId = id("verifyuser")
const sessionId = id("verifysession")
const token = crypto.randomBytes(24).toString("hex")
const now = new Date()
const expires = new Date(now.getTime() + 60 * 60 * 1000)

await client.query(
  `INSERT INTO "User" (id, email, name, "emailVerified", role, "scanConsentGivenAt", "createdAt", "updatedAt")
   VALUES ($1, $2, 'Scan Layout Verification', true, 'USER', now(), now(), now())`,
  [userId, `scan-layout-verify-${userId}@example.invalid`],
)

await client.query(
  `INSERT INTO "AuthSession" (id, "userId", token, "expiresAt", "createdAt", "updatedAt")
   VALUES ($1, $2, $3, $4, now(), now())`,
  [sessionId, userId, token, expires],
)

// Same signing as better-call's serializeSignedCookie (node_modules/
// better-call/dist/crypto.mjs) — HMAC-SHA256, standard base64, "value.sig",
// URI-encoded. DEFAULT_SECRET since no BETTER_AUTH_SECRET is set anywhere
// (matches what the running dev server also falls back to).
const DEFAULT_SECRET = "better-auth-secret-12345678901234567890"
const key = await crypto.webcrypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(DEFAULT_SECRET),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign"],
)
const sigBuf = await crypto.webcrypto.subtle.sign("HMAC", key, new TextEncoder().encode(token))
const signature = Buffer.from(sigBuf).toString("base64")
const cookieValue = encodeURIComponent(`${token}.${signature}`)

console.log(`USER_ID=${userId}`)
console.log(`SESSION_ID=${sessionId}`)
console.log(`COOKIE=better-auth.session_token=${cookieValue}`)

await client.end()
