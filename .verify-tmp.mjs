import { chromium } from "playwright"

const BASE = "http://localhost:3001"
const SHOT_DIR = "/tmp/claude-1000/-home-emma-AURA/4a27987c-e58d-4147-a79b-f14a45e73dc1/scratchpad/shots"
const EMAIL = process.env.TEST_EMAIL
const PASSWORD = process.env.TEST_PASSWORD

const results = []
function log(name, ok, note) {
  results.push({ name, ok, note })
  console.log(`${ok ? "PASS" : "FAIL"} — ${name}${note ? " — " + note : ""}`)
}

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" })
  await page.fill("#email", EMAIL)
  await page.fill("#password", PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForTimeout(4000)
  console.log("  [after submit] url =", page.url())
  const bodyText = await page.locator("form").first().textContent().catch(() => null)
  if (bodyText) console.log("  [after submit] form text =", bodyText.slice(0, 400))
  await page.waitForURL(/\/dashboard/, { timeout: 15000 })
}

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    const root = document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(t)
    localStorage.setItem("theme", t)
  }, theme)
  await page.reload({ waitUntil: "load", timeout: 45000 })
}

async function checkSidebar(page, path, width, height, theme) {
  const label = `${path} @ ${width}x${height} ${theme}`
  await page.setViewportSize({ width, height })
  await page.goto(`${BASE}${path}`, { waitUntil: "load", timeout: 45000 })
  await page.waitForTimeout(1500)
  await setTheme(page, theme)

  const desktopAside = page.locator('aside:has-text("Aura")').first()
  const desktopVisible = await desktopAside.isVisible().catch(() => false)

  const trigger = page.getByRole("button", { name: /open menu/i })
  const triggerVisible = await trigger.isVisible().catch(() => false)

  if (desktopVisible) {
    log(`${label}: desktop sidebar hidden`, false, "fixed <aside> still visible at mobile width")
  } else {
    log(`${label}: desktop sidebar hidden`, true)
  }

  if (!triggerVisible) {
    log(`${label}: mobile menu trigger visible`, false, "no 'Open menu' button found/visible")
    await page.screenshot({ path: `${SHOT_DIR}/${path.replace(/\//g, "_")}_${width}_${theme}_FAIL.png` })
    return
  }
  log(`${label}: mobile menu trigger visible`, true)

  await page.screenshot({ path: `${SHOT_DIR}/${path.replace(/\//g, "_")}_${width}_${theme}_closed.png` })

  await trigger.click()
  const sheet = page.locator('[role="dialog"]').first()
  const sheetOpened = await sheet.isVisible({ timeout: 3000 }).catch(() => false)
  log(`${label}: drawer opens`, sheetOpened)

  if (sheetOpened) {
    await page.screenshot({ path: `${SHOT_DIR}/${path.replace(/\//g, "_")}_${width}_${theme}_open.png` })

    // check content overlap: sheet bounding box should not be clipped/offscreen
    const box = await sheet.boundingBox()
    const withinViewport = box && box.x >= -1 && box.x + box.width <= width + 1
    log(`${label}: drawer within viewport (no overlap/clip)`, Boolean(withinViewport), box ? JSON.stringify(box) : "no box")

    // click a nav link that goes to a DIFFERENT page than the current one
    // (clicking same-page link races the Sheet's close animation)
    const allLinks = sheet.getByRole("link")
    const count = await allLinks.count()
    let navLink = null
    let navLinkText = null
    for (let i = 0; i < count; i++) {
      const l = allLinks.nth(i)
      const href = await l.getAttribute("href").catch(() => null)
      if (href && href !== path) {
        navLink = l
        navLinkText = await l.textContent().catch(() => href)
        break
      }
    }
    if (navLink) {
      await navLink.click()
      await page.waitForLoadState("load", { timeout: 15000 }).catch(() => {})
      await page.waitForTimeout(800)
      // Radix Sheet has an exit animation — poll briefly instead of
      // checking immediately after click.
      let stillOpen = true
      for (let i = 0; i < 10; i++) {
        stillOpen = await sheet.isVisible().catch(() => false)
        if (!stillOpen) break
        await page.waitForTimeout(200)
      }
      log(`${label}: drawer closes after nav click ("${navLinkText?.trim()}")`, !stillOpen)
    } else {
      log(`${label}: drawer closes after nav click`, false, "no other-page nav link found in drawer")
    }
  }
}

async function checkDownload(page, name, gotoPath, clickFn) {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto(`${BASE}${gotoPath}`, { waitUntil: "load", timeout: 45000 })
  await page.waitForTimeout(1500)
  try {
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 10000 }),
      clickFn(page),
    ])
    const filename = download.suggestedFilename()
    log(`download: ${name}`, true, `suggestedFilename="${filename}"`)
  } catch (e) {
    log(`download: ${name}`, false, String(e.message || e).slice(0, 200))
  }
}

const browser = await chromium.launch()
const context = await browser.newContext()
const page = await context.newPage()
page.on("console", (msg) => {
  if (msg.type() === "error") console.log("  [console.error]", msg.text().slice(0, 200))
})
page.on("response", async (res) => {
  if (res.status() >= 400) {
    let body = ""
    try { body = (await res.text()).slice(0, 200) } catch {}
    console.log(`  [${res.status()}] ${res.url()} ${body}`)
  }
})

await login(page)
log("login", true, `landed on ${page.url()}`)

// find a reportId to use for direct report-page/table tests
let reportId = null
try {
  await page.goto(`${BASE}/reports`, { waitUntil: "networkidle" })
  const firstReportLink = page.locator('a[href^="/reports/"]').first()
  const href = await firstReportLink.getAttribute("href").catch(() => null)
  if (href) reportId = href.split("/reports/")[1]?.split(/[/?#]/)[0]
} catch {}
log("found existing report for download tests", Boolean(reportId), reportId ? `reportId=${reportId}` : "none found")

// --- Sidebar checks ---
const pages = ["/admin", "/admin/analytics"]
const widths = [
  { w: 375, h: 812 },
  { w: 390, h: 844 },
]
const themes = ["light", "dark"]

for (const p of pages) {
  for (const { w, h } of widths) {
    for (const t of themes) {
      await checkSidebar(page, p, w, h, t)
    }
  }
}

// --- Download checks ---
if (reportId) {
  await checkDownload(page, "report detail page 'Download PDF Report'", `/reports/${reportId}`, async (pg) => {
    await pg.getByRole("link", { name: /download pdf report/i }).click()
  })

  await checkDownload(page, "reports table row-menu 'Download PDF'", `/reports`, async (pg) => {
    const menuTrigger = pg.locator("details summary").first()
    await menuTrigger.click()
    await pg.getByRole("link", { name: /^download pdf$/i }).first().click()
  })
} else {
  log("download: report detail page", false, "skipped, no report found")
  log("download: reports table row-menu", false, "skipped, no report found")
}

await checkDownload(page, "account 'Download JSON' data export", `/account`, async (pg) => {
  await pg.getByRole("link", { name: /download json/i }).click()
})

log("download: post-scan screen 'Download PDF'", false, "skipped — requires completing a full scan flow, not exercised in this pass")

await browser.close()

console.log("\n=== SUMMARY ===")
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"} | ${r.name}${r.note ? " | " + r.note : ""}`)
}
const failCount = results.filter((r) => !r.ok).length
console.log(`\n${results.length - failCount}/${results.length} passed`)
process.exit(failCount > 0 ? 1 : 0)
