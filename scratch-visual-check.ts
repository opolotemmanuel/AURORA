import { chromium } from "playwright-core"

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

  // Landing page — hero uses font-display (Cormorant Garamond)
  await page.goto("http://localhost:3001/", { waitUntil: "load", timeout: 30000 })
  await page.screenshot({ path: "/tmp/visual-landing-light.png", fullPage: false })

  const heroFont = await page.evaluate(() => {
    const el = document.querySelector(".font-display, h1")
    return el ? getComputedStyle(el).fontFamily : "NOT FOUND"
  })
  console.log("Landing hero computed font-family:", heroFont)

  const bodyFont = await page.evaluate(() => getComputedStyle(document.body).fontFamily)
  console.log("Body computed font-family:", bodyFont)

  // dark mode
  await page.emulateMedia({ colorScheme: "dark" })
  await page.evaluate(() => {
    document.documentElement.classList.add("dark")
    document.documentElement.setAttribute("data-theme", "dark")
  })
  await page.waitForTimeout(200)
  await page.screenshot({ path: "/tmp/visual-landing-dark.png", fullPage: false })
  const darkBodyFont = await page.evaluate(() => getComputedStyle(document.body).fontFamily)
  console.log("Dark mode body computed font-family:", darkBodyFont)

  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
