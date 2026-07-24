import { chromium } from "playwright-core"

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.goto("http://localhost:3001/", { waitUntil: "networkidle", timeout: 30000 })
  await page.waitForTimeout(500)
  const heroFont = await page.evaluate(() => {
    const el = document.querySelector("h1")
    return el ? getComputedStyle(el).fontFamily : "NOT FOUND"
  })
  console.log("AFTER fix — hero <h1> computed font-family:", heroFont)
  const bodyFont = await page.evaluate(() => getComputedStyle(document.body).fontFamily)
  console.log("AFTER fix — body computed font-family:", bodyFont)
  await page.screenshot({ path: "/tmp/visual-hero-crop-after.png", clip: { x: 0, y: 60, width: 640, height: 220 } })
  await browser.close()
}
main().catch((e) => { console.error(e); process.exit(1) })
