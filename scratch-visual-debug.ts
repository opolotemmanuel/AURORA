import { chromium } from "playwright-core"
async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.goto("http://localhost:3001/", { waitUntil: "networkidle", timeout: 30000 })
  await page.waitForTimeout(2000)
  const info = await page.evaluate(() => {
    const h1 = document.querySelector("h1")
    const rect = h1!.getBoundingClientRect()
    const topEl = document.elementFromPoint(rect.x + 10, rect.y + 10)
    const style = getComputedStyle(h1!)
    return {
      rect,
      topElTag: topEl?.tagName,
      topElClass: (topEl as HTMLElement)?.className,
      h1Color: style.color,
      h1Opacity: style.opacity,
      h1Transform: style.transform,
      h1Visibility: style.visibility,
      h1Text: h1!.textContent,
      bodyBg: getComputedStyle(document.body).backgroundColor,
    }
  })
  console.log(JSON.stringify(info, null, 2))
  await browser.close()
}
main().catch((e) => { console.error(e); process.exit(1) })
