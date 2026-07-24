import { chromium } from "playwright-core"

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.goto("http://localhost:3001/", { waitUntil: "networkidle", timeout: 30000 })
  await page.waitForTimeout(500)
  await page.screenshot({ path: "/tmp/visual-hero-crop-after2.png", clip: { x: 0, y: 150, width: 700, height: 350 } })
  await browser.close()
}
main().catch((e) => { console.error(e); process.exit(1) })
