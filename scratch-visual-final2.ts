import { chromium } from "playwright-core"

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.goto("http://localhost:3001/", { waitUntil: "networkidle", timeout: 30000 })
  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(1000)
    const opacity = await page.evaluate(() => {
      const h1 = document.querySelector("h1")
      return h1 ? getComputedStyle(h1).opacity : "NO H1"
    })
    console.log(`t=${i + 1}s opacity=`, opacity)
  }
  await page.screenshot({ path: "/tmp/zz-BEFORE-final2.png" })
  await browser.close()
}
main().catch((e) => { console.error(e); process.exit(1) })
