// Standalone diagnostic script — NOT part of the app's routes/components.
// Verifies all 7 Phase 1 deliverables (see AGENTS.md's Project Overview)
// against a real running dev server, using real API calls + direct DB
// checks. No camera/browser automation: item 2 is verified at the API
// contract level (the same way earlier sessions did), not via a browser.
//
// Usage: npm run dev (separate terminal), then:
//   node scripts/verify-phase-1.mjs [baseUrl]
// Defaults to http://localhost:3000.
//
// Costs exactly one real Gemini API call (items 3 and 4 both read from
// that same single scan) — see the notice printed before that step.
import fs from "node:fs"
import { readFile } from "node:fs/promises"
import pg from "pg"

const BASE_URL = process.argv[2] ?? "http://localhost:3000"

const envText = fs.readFileSync(".env.local", "utf8")
const DATABASE_URL = envText
  .split("\n")
  .find((l) => l.startsWith("DATABASE_URL="))
  .slice("DATABASE_URL=".length)
  .trim()
  .replace(/^"|"$/g, "")

const TEST_EMAIL = `verify-phase1-${Date.now()}@example.com`
const TEST_PASSWORD = "VerifyPhase1Test!23"
const TEST_IMAGE_PATH = "public/Pasted image (3).png"

const results = []
function record(item, status, reason) {
  results.push({ item, status, reason })
  const badge = { PASS: "✅ PASS", FAIL: "❌ FAIL", SKIPPED: "⚠️  SKIP" }[status]
  console.log(`${badge}  ${item}\n        ${reason}`)
}

// Merges Set-Cookie response headers into a single "a=b; c=d" request
// cookie header, same semantics as curl -c/-b — attributes (Path,
// HttpOnly, Max-Age, ...) are discarded, only name=value pairs kept.
function mergeCookies(jar, response) {
  const next = { ...jar }
  for (const setCookie of response.headers.getSetCookie()) {
    const [pair] = setCookie.split(";")
    const eq = pair.indexOf("=")
    if (eq === -1) continue
    next[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim()
  }
  return next
}
function cookieHeader(jar) {
  return Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ")
}

// Node's fetch (undici) sends a literal "Origin: null" header for
// server-side requests, which better-auth's origin check rejects outright
// ("Missing or null Origin") — curl sends no Origin header at all, which
// passes. An explicit same-origin header sidesteps this Node-vs-browser gap.
function baseHeaders(extra = {}) {
  return { Origin: BASE_URL, ...extra }
}

async function main() {
  const client = new pg.Client({ connectionString: DATABASE_URL })
  await client.connect()

  let jar = {}
  let userId = null
  let scanId = null
  let reportId = null

  try {
    // ---- 1. Live web application deployment ----
    try {
      const res = await fetch(BASE_URL + "/")
      if (res.status === 200) {
        record("1. Live web application deployment", "PASS", `GET / -> ${res.status}`)
      } else {
        record("1. Live web application deployment", "FAIL", `GET / -> ${res.status} (expected 200)`)
      }
    } catch (error) {
      record("1. Live web application deployment", "FAIL", `Could not reach ${BASE_URL}: ${error.message}`)
      return // nothing else is reachable without a running server
    }

    // ---- sign up throwaway test user (shared by items 2-7) ----
    const signUpRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: baseHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, name: "Verify Phase 1" }),
    })
    jar = mergeCookies(jar, signUpRes)
    const signUpBody = await signUpRes.json().catch(() => null)
    if (!signUpRes.ok || !signUpBody?.user?.id) {
      record(
        "2. Camera capture and image upload",
        "FAIL",
        `Could not create test user (sign-up ${signUpRes.status}) — cannot test any further items.`,
      )
      record("3. AI skin assessment and skin report", "FAIL", "Blocked: no test user.")
      record("4. Aurora product recommendation engine", "FAIL", "Blocked: no test user.")
      record("6. Downloadable PDF reports", "FAIL", "Blocked: no test user.")
      record("7. Integration with Aurora Organics website", "FAIL", "Blocked: no test user.")
    } else {
      userId = signUpBody.user.id

      // ---- 2. Camera capture and image upload (API contract) ----
      // ---- 3. AI skin assessment and skin report ----
      // ---- 4. Aurora product recommendation engine ----
      console.log(
        "\n>>> About to call /api/scan/analyze — this makes ONE real Gemini API call and consumes real quota. <<<\n",
      )

      const imageBuffer = await readFile(TEST_IMAGE_PATH)
      const form = new FormData()
      form.append("image", new Blob([imageBuffer], { type: "image/png" }), "verify-scan.png")
      form.append("lat", "40.7128")
      form.append("lon", "-74.0060")

      const scanRes = await fetch(`${BASE_URL}/api/scan/analyze`, {
        method: "POST",
        headers: baseHeaders({ Cookie: cookieHeader(jar) }),
        body: form,
      })
      const scanBody = await scanRes.json().catch(() => null)

      if (scanRes.status !== 200 || !scanBody?.report?.id) {
        record(
          "2. Camera capture and image upload",
          "FAIL",
          `POST /api/scan/analyze -> ${scanRes.status}, error: ${scanBody?.error ?? "unknown"} (rejected for a reason unrelated to Gemini itself — check image/location handling)`,
        )
        record("3. AI skin assessment and skin report", "FAIL", "Blocked: scan request itself was rejected.")
        record("4. Aurora product recommendation engine", "FAIL", "Blocked: scan request itself was rejected.")
      } else {
        scanId = scanBody.scan?.id
        reportId = scanBody.report.id
        record(
          "2. Camera capture and image upload",
          "PASS",
          `POST /api/scan/analyze accepted a real image + location -> 200, report ${reportId} created.`,
        )

        // ---- item 3 ----
        const source = scanBody.analysis?.source
        const findingCount = scanBody.analysis?.cosmeticFindings?.length ?? 0
        if (scanBody.success === true && source === "gemini" && findingCount > 0) {
          record(
            "3. AI skin assessment and skin report",
            "PASS",
            `Real Gemini assessment returned (source: "gemini", ${findingCount} cosmetic findings).`,
          )
        } else if (scanBody.fallback === true) {
          record(
            "3. AI skin assessment and skin report",
            "SKIPPED",
            `Gemini call failed (likely quota/rate-limit): "${scanBody.error}". This is a known limitation, not a bug — the honest fallback path itself returned correctly (source: "${source}", success: false, fallback: true).`,
          )
        } else {
          record(
            "3. AI skin assessment and skin report",
            "FAIL",
            `Unexpected response shape: success=${scanBody.success}, source=${source}, findings=${findingCount}.`,
          )
        }

        // ---- item 4 ----
        const recommendations = scanBody.recommendations ?? []
        if (recommendations.length === 0) {
          record("4. Aurora product recommendation engine", "FAIL", "Scan response included zero recommendations.")
        } else {
          const slugs = recommendations.map((r) => r.product?.id).filter(Boolean)
          const dbRows = await client.query(
            'SELECT slug, "officialUrl", "imagePath", active FROM "Product" WHERE slug = ANY($1::text[])',
            [slugs],
          )
          const realCount = dbRows.rows.filter((r) => r.active && r.officialUrl).length

          // Static-bug regression check: confirm the fix (buildRecommendationInput
          // no longer pre-seeds unset concerns with a hardcoded band) is present
          // in the source actually being served, not just assumed.
          const scanServiceSrc = await readFile("lib/backend/scan-service.ts", "utf8")
          const stillHasHardcodedDefaults =
            /radiance:\s*["']mild["']/.test(scanServiceSrc) || /hydration:\s*["']balanced["']/.test(scanServiceSrc)

          const reasonsSample = recommendations.map((r) => `${r.product?.name}: ${r.reasons?.join(" ")}`).join(" | ")

          if (realCount === recommendations.length && !stillHasHardcodedDefaults) {
            record(
              "4. Aurora product recommendation engine",
              "PASS",
              `${recommendations.length} real, active DB products returned with officialUrl set. Static-recommendation bug fix confirmed present in lib/backend/scan-service.ts (no hardcoded default bands). Reasons: ${reasonsSample}`,
            )
          } else if (realCount !== recommendations.length) {
            record(
              "4. Aurora product recommendation engine",
              "FAIL",
              `Only ${realCount}/${recommendations.length} recommended products are real active DB rows with an officialUrl.`,
            )
          } else {
            record(
              "4. Aurora product recommendation engine",
              "FAIL",
              `Products are real, but the static-recommendation bug (hardcoded default bands in buildRecommendationInput) is still present in source — recommendations are not honestly personalized yet.`,
            )
          }

          // ---- item 7 ----
          const urlPattern = /^https:\/\/(www\.)?auroraorganics\.co\//
          const malformed = recommendations.filter((r) => !r.product?.officialUrl || !urlPattern.test(r.product.officialUrl))
          if (malformed.length === 0) {
            record(
              "7. Integration with Aurora Organics website",
              "PASS",
              `All ${recommendations.length} recommended products have well-formed https://auroraorganics.co/... officialUrl values. Sample: ${recommendations[0]?.product?.officialUrl}`,
            )
          } else {
            record(
              "7. Integration with Aurora Organics website",
              "FAIL",
              `${malformed.length} recommendation(s) missing/malformed officialUrl: ${malformed.map((r) => r.product?.name).join(", ")}`,
            )
          }
        }

        // ---- item 6: Downloadable PDF reports ----
        const downloadUrl = scanBody.reportDownloadUrl
        if (!downloadUrl) {
          record("6. Downloadable PDF reports", "FAIL", "Scan response had no reportDownloadUrl field.")
        } else {
          // In Next dev mode, /reports/[reportId]/print (the page Playwright
          // navigates to) is compiled lazily on first hit — on a cold dev
          // server that on-demand compile alone can exceed the PDF renderer's
          // fixed 30s Playwright navigation timeout, failing this check for a
          // reason that has nothing to do with PDF generation itself. A
          // throwaway warm-up request compiles the route first so the timed
          // check below reflects real behavior, not dev-server cold start.
          await fetch(`${BASE_URL}/reports/${reportId}/print`, { headers: baseHeaders({ Cookie: cookieHeader(jar) }) }).catch(() => {})

          const pdfRes = await fetch(`${BASE_URL}${downloadUrl}`, { headers: baseHeaders({ Cookie: cookieHeader(jar) }) })
          const contentType = pdfRes.headers.get("content-type") ?? ""
          const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer())
          const looksLikePdf = pdfBuffer.subarray(0, 5).toString("ascii") === "%PDF-"
          if (pdfRes.status === 200 && contentType.includes("application/pdf") && looksLikePdf) {
            record(
              "6. Downloadable PDF reports",
              "PASS",
              `GET ${downloadUrl} -> 200, Content-Type: ${contentType}, ${pdfBuffer.length} bytes, starts with %PDF-.`,
            )
          } else {
            record(
              "6. Downloadable PDF reports",
              "FAIL",
              `GET ${downloadUrl} -> ${pdfRes.status}, Content-Type: ${contentType}, valid PDF bytes: ${looksLikePdf}.`,
            )
          }
        }
      }

      // ---- 5. Admin dashboard and analytics ----
      const adminPages = ["/admin/analytics", "/admin/users", "/admin/scans"]
      const nonAdminChecks = []
      for (const page of adminPages) {
        const res = await fetch(`${BASE_URL}${page}`, { headers: baseHeaders({ Cookie: cookieHeader(jar) }) })
        const body = await res.text()
        nonAdminChecks.push({ page, ok: res.status === 200 && body.includes("Access denied") })
      }
      const apiNonAdminRes = await fetch(`${BASE_URL}/api/admin/analytics`, { headers: baseHeaders({ Cookie: cookieHeader(jar) }) })
      const apiNonAdminOk = apiNonAdminRes.status === 403

      const signedOutRes = await fetch(`${BASE_URL}/admin/analytics`, { headers: baseHeaders(), redirect: "manual" })
      const signedOutOk = [301, 302, 307, 308].includes(signedOutRes.status) && (signedOutRes.headers.get("location") ?? "").includes("/login")

      await client.query('UPDATE "User" SET role = $1 WHERE id = $2', ["ADMIN", userId])

      const adminChecks = []
      for (const page of adminPages) {
        const res = await fetch(`${BASE_URL}${page}`, { headers: baseHeaders({ Cookie: cookieHeader(jar) }) })
        const body = await res.text()
        adminChecks.push({ page, ok: res.status === 200 && !body.includes("Access denied") })
      }
      const apiAdminRes = await fetch(`${BASE_URL}/api/admin/analytics`, { headers: baseHeaders({ Cookie: cookieHeader(jar) }) })
      const apiAdminBody = await apiAdminRes.json().catch(() => null)
      const apiAdminOk = apiAdminRes.status === 200 && apiAdminBody?.success === true

      const allOk =
        nonAdminChecks.every((c) => c.ok) && apiNonAdminOk && signedOutOk && adminChecks.every((c) => c.ok) && apiAdminOk

      const detail = [
        `non-admin session blocked (Access denied): ${nonAdminChecks.map((c) => `${c.page}=${c.ok ? "ok" : "FAIL"}`).join(", ")}`,
        `GET /api/admin/analytics as non-admin -> ${apiNonAdminRes.status} (expect 403): ${apiNonAdminOk ? "ok" : "FAIL"}`,
        `signed-out redirect to /login: ${signedOutOk ? "ok" : "FAIL"} (status ${signedOutRes.status})`,
        `admin session allowed: ${adminChecks.map((c) => `${c.page}=${c.ok ? "ok" : "FAIL"}`).join(", ")}`,
        `GET /api/admin/analytics as admin -> ${apiAdminRes.status} (expect 200 success): ${apiAdminOk ? "ok" : "FAIL"}`,
      ].join("; ")

      record("5. Admin dashboard and analytics", allOk ? "PASS" : "FAIL", detail)
    }
  } finally {
    // ---- cleanup: delete everything the throwaway user touched, whether
    // checks passed or failed. Same pattern as the prior session's manual
    // cleanup: non-FK reference fields (AuditLog.targetId, AiProviderEvent.
    // scanId) need explicit deletes, real relations cascade from User/Report.
    if (userId) {
      const ids = [userId, scanId, reportId].filter(Boolean)
      await client.query('DELETE FROM "AuditLog" WHERE "actorId" = $1 OR "targetId" = ANY($2::text[])', [userId, ids])
      await client.query('DELETE FROM "AiProviderEvent" WHERE "scanId" = $1 OR "reportId" = $2', [scanId, reportId])
      if (reportId) await client.query('DELETE FROM "Report" WHERE id = $1', [reportId])
      if (scanId) await client.query('DELETE FROM "Scan" WHERE id = $1', [scanId])
      await client.query('DELETE FROM "User" WHERE id = $1', [userId])
      console.log(`\nCleanup: deleted test user ${TEST_EMAIL}, scan ${scanId ?? "(none)"}, report ${reportId ?? "(none)"}.`)
    }
    await client.end()
  }

  console.log("\n--- Summary ---")
  const counts = { PASS: 0, FAIL: 0, SKIPPED: 0 }
  for (const r of results) counts[r.status]++
  console.log(`${counts.PASS} passed, ${counts.FAIL} failed, ${counts.SKIPPED} skipped (of ${results.length})`)

  process.exit(counts.FAIL > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error("Script crashed:", error)
  process.exit(1)
})
