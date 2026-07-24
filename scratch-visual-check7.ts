import { chromium } from "playwright-core"

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.goto("http://localhost:3001/", { waitUntil: "networkidle", timeout: 30000 })
  await page.waitForTimeout(500)
  const h1 = page.locator("h1").first()
  const box = await h1.boundingBox()
  console.log("h1 bounding box:", JSON.stringify(box))
  await page.screenshot({ path: "/tmp/hero-crop-AFTER-precise.png", clip: { x: 0, y: Math.max(0, (box?.y ?? 0) - 20), width: 700, height: (box?.height ?? 100) + 60 } })
  await browser.close()
}
main().catch((e) => { console.error(e); process.exit(1) })
