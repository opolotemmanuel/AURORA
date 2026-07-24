import { chromium } from "playwright-core"

async function shoot(path: string) {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.goto("http://localhost:3001/", { waitUntil: "networkidle", timeout: 30000 })
  await page.waitForFunction(() => {
    const h1 = document.querySelector("h1")
    return h1 && parseFloat(getComputedStyle(h1).opacity) > 0.95
  }, { timeout: 10000 }).catch(() => console.log("opacity wait timed out for", path))
  await page.waitForTimeout(300)
  await page.screenshot({ path })
  await browser.close()
}

shoot(process.argv[2]).catch((e) => { console.error(e); process.exit(1) })
