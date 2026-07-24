import { chromium } from "playwright-core"

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.goto("http://localhost:3001/", { waitUntil: "networkidle", timeout: 30000 })
  await page.waitForTimeout(1500)
  const info = await page.evaluate(() => {
    const h1 = document.querySelector("h1")
    if (!h1) return "NO H1"
    const style = getComputedStyle(h1)
    const rect = h1.getBoundingClientRect()
    return {
      text: h1.textContent,
      opacity: style.opacity,
      visibility: style.visibility,
      display: style.display,
      color: style.color,
      fontSize: style.fontSize,
      rect,
    }
  })
  console.log(JSON.stringify(info, null, 2))
  await browser.close()
}
main().catch((e) => { console.error(e); process.exit(1) })
