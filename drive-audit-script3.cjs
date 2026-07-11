const { chromium } = require("playwright");
const SHOT_DIR = "/tmp/claude-1000/-home-emma-AURA/50ff6fea-3aef-41a5-8e91-2216b8f6b615/scratchpad/shots";
const BASE = "http://localhost:3000";

(async () => {
  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage();

  await page.goto(`${BASE}/register`, { waitUntil: "networkidle" });
  await page.fill('input#name', "Sidebar Recheck 2");
  await page.fill('input[type="email"]', `sidebar-recheck2-${Date.now()}@example.com`);
  const pwFields = await page.$$('input[type="password"]');
  for (const f of pwFields) await f.fill("TestPass123!");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);
  console.log("post-submit URL:", page.url());

  // Hard reload /dashboard (bypasses stale router cache) rather than relying
  // on the client push that has the known cache-staleness issue.
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  console.log("first /dashboard hit:", page.url());
  await page.reload({ waitUntil: "networkidle" });
  console.log("after hard reload:", page.url());
  await page.screenshot({ path: `${SHOT_DIR}/recheck2-dashboard.png`, fullPage: true });

  await browser.close();
})();
