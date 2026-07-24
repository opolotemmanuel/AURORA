import { chromium } from "playwright-core"

async function main() {
  const cookieValue = process.argv[2]
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1280, height: 1400 }, colorScheme: "dark" })
  await context.addCookies([
    { name: "better-auth.session_token", value: cookieValue, url: "http://localhost:3001" },
  ])
  const page = await context.newPage()
  await page.addInitScript(() => {
    document.documentElement.classList.add("dark")
  })
  await page.goto("http://localhost:3001/reports/report_mrxd8uql_w54298", { waitUntil: "networkidle", timeout: 30000 })
  await page.waitForTimeout(1000)
  await page.evaluate(() => document.documentElement.classList.add("dark"))
  await page.waitForTimeout(300)
  await page.screenshot({ path: "/tmp/report-dark.png", fullPage: false })
  const info = await page.evaluate(() => ({
    bg: getComputedStyle(document.body).backgroundColor,
    hasDarkClass: document.documentElement.classList.contains("dark"),
  }))
  console.log(JSON.stringify(info))
  await browser.close()
}
main().catch((e) => { console.error(e); process.exit(1) })
