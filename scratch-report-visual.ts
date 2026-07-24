import { chromium } from "playwright-core"

async function main() {
  const cookieValue = process.argv[2]
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1280, height: 1400 } })
  await context.addCookies([
    { name: "better-auth.session_token", value: cookieValue, url: "http://localhost:3001" },
  ])
  const page = await context.newPage()
  await page.goto("http://localhost:3001/reports/report_mrxd8uql_w54298", { waitUntil: "networkidle", timeout: 30000 })
  await page.waitForTimeout(1000)

  const fonts = await page.evaluate(() => {
    const h2 = document.querySelector("h2")
    const body = document.body
    return {
      h2Font: h2 ? getComputedStyle(h2).fontFamily : "NOT FOUND",
      bodyFont: getComputedStyle(body).fontFamily,
    }
  })
  console.log("Report page (light) fonts:", JSON.stringify(fonts, null, 2))
  await page.screenshot({ path: "/tmp/report-light.png", fullPage: false })

  // dark mode
  await page.evaluate(() => {
    document.documentElement.classList.add("dark")
    localStorage.setItem("theme", "dark")
  })
  await page.reload({ waitUntil: "networkidle" })
  await page.waitForTimeout(1000)
  await page.screenshot({ path: "/tmp/report-dark.png", fullPage: false })
  const darkBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  console.log("Dark mode body bg:", darkBg)

  await browser.close()
}
main().catch((e) => { console.error(e); process.exit(1) })
