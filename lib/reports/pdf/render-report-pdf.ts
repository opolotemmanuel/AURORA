// Turns the print-mode report page (app/reports/[reportId]/print) into a
// real PDF via headless Chrome — the same visual source of truth as the web
// report, just printed rather than re-implemented in a second layout engine
// (see the PDF-approach decision in this feature's plan). A single browser
// instance is reused across requests (module-level singleton) to stay under
// the spec's 5-second generation budget; only a fresh, isolated
// BrowserContext is created per request, carrying just that request's
// session cookie so PDFs render as the requesting user and concurrent
// requests never see each other's cookies.
import type { Browser } from "playwright-core"

// Generous headroom: the print page's own render (several DB round trips —
// see load-report-view-model.ts) can itself take several seconds depending
// on database latency, before Playwright's navigation even resolves.
const PAGE_TIMEOUT_MS = 30_000

let browserPromise: Promise<Browser> | null = null

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = launchBrowser().catch((error) => {
      // Don't cache a failed launch — the next request should retry rather
      // than permanently fail for the lifetime of the process.
      browserPromise = null
      throw error
    })
  }
  return browserPromise
}

async function launchBrowser(): Promise<Browser> {
  const { chromium } = await import("playwright-core")

  // Vercel (and other serverless targets) have no bundled Chromium — pull in
  // @sparticuz/chromium-min's serverless-compatible binary. Locally,
  // `playwright` manages its own full Chromium install (`npx playwright
  // install chromium`), so this branch never runs in dev.
  if (process.env.VERCEL) {
    const sparticuzChromium = (await import("@sparticuz/chromium-min")).default
    // A self-hosted CHROMIUM_PACK_URL can be set for production hardening;
    // sparticuzChromium.executablePath() falls back to its own hosted pack
    // matching the installed package version if omitted.
    const executablePath = await sparticuzChromium.executablePath(process.env.CHROMIUM_PACK_URL)
    return chromium.launch({
      args: sparticuzChromium.args,
      executablePath,
      headless: true,
    })
  }

  return chromium.launch({ headless: true })
}

export async function renderReportPdf(input: {
  reportId: string
  // The origin the download request itself arrived on (e.g.
  // `new URL(request.url).origin`) — NOT process.env.BETTER_AUTH_URL.
  // BETTER_AUTH_URL is deliberately pinned to the canonical production
  // origin for auth-link purposes (see lib/auth/auth.ts) and is wrong here
  // whenever the app is reachable somewhere else: a local dev server that
  // landed on a fallback port because 3000 was already taken, or a Vercel
  // preview deployment. Using the request's own origin means this always
  // points at wherever this code is actually running.
  baseUrl: string
  // The whole request cookie jar, forwarded as-is rather than picking out
  // one cookie by name — avoids hardcoding better-auth's default
  // "better-auth.session_token" naming convention, which would silently
  // break if a custom cookiePrefix/cookie name were ever configured.
  cookies: Array<{ name: string; value: string }>
}): Promise<Buffer> {
  const baseUrl = input.baseUrl
  const printUrl = new URL(`/reports/${input.reportId}/print`, baseUrl)

  const browser = await getBrowser()
  const context = await browser.newContext()

  try {
    await context.addCookies(input.cookies.map((cookie) => ({ ...cookie, url: baseUrl })))

    const page = await context.newPage()
    // Not "networkidle": this page is fully server-rendered with no
    // client-side fetching after load, and in dev mode Next's HMR keeps a
    // persistent WebSocket open, which "networkidle" would wait on forever.
    await page.goto(printUrl.toString(), { waitUntil: "load", timeout: PAGE_TIMEOUT_MS })
    await page.emulateMedia({ media: "print", colorScheme: "light" })

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      margin: { top: "64px", bottom: "48px", left: "24px", right: "24px" },
      headerTemplate: `
        <div style="font-size: 9px; width: 100%; padding: 0 24px; color: #6b6b6b; display: flex; justify-content: space-between;">
          <span>Aura — AI Skin Intelligence Report</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 9px; width: 100%; padding: 0 24px; color: #6b6b6b; display: flex; justify-content: flex-end;">
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `,
    })

    return pdf
  } finally {
    await context.close()
  }
}
