const { chromium } = require("playwright");
const SHOT_DIR = "/tmp/claude-1000/-home-emma-AURA/50ff6fea-3aef-41a5-8e91-2216b8f6b615/scratchpad/shots";
const BASE = "http://localhost:3000";

(async () => {
  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage();

  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', "sidebar-audit-recheck@example.com");
  // register a fresh known user, then confirm /dashboard directly
  await page.goto(`${BASE}/register`, { waitUntil: "networkidle" });
  await page.fill('input#name', "Sidebar Recheck");
  await page.fill('input[type="email"]', `sidebar-recheck-${Date.now()}@example.com`);
  const pwFields = await page.$$('input[type="password"]');
  for (const f of pwFields) await f.fill("TestPass123!");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);
  console.log("post-submit URL:", page.url());

  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  console.log("dashboard URL:", page.url());
  await page.screenshot({ path: `${SHOT_DIR}/recheck-dashboard.png`, fullPage: true });

  await browser.close();
})();
