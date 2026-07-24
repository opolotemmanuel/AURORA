import { chromium } from "playwright-core"

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  page.on("console", (msg) => console.log("CONSOLE:", msg.type(), msg.text()))
  page.on("pageerror", (err) => console.log("PAGEERROR:", err.message))
  await page.goto("http://localhost:3001/", { waitUntil: "networkidle", timeout: 30000 })
  await page.waitForTimeout(1000)
  const bodyHTML = await page.evaluate(() => document.querySelector("main")?.innerHTML.slice(0, 500) ?? "NO MAIN")
  console.log("main innerHTML sample:", bodyHTML)
  await browser.close()
}
main().catch((e) => { console.error(e); process.exit(1) })
