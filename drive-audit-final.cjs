const { chromium } = require("playwright");
const SHOT_DIR = "/tmp/claude-1000/-home-emma-AURA/50ff6fea-3aef-41a5-8e91-2216b8f6b615/scratchpad/shots";
const BASE = "http://localhost:3000";

(async () => {
  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));

  await page.goto(`${BASE}/register`, { waitUntil: "networkidle" });
  await page.fill('input#name', "Final Audit User");
  await page.fill('input[type="email"]', `final-audit-${Date.now()}@example.com`);
  const pwFields = await page.$$('input[type="password"]');
  for (const f of pwFields) await f.fill("TestPass123!");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  if (!/\/dashboard/.test(page.url())) {
    await page.reload({ waitUntil: "networkidle" });
  }
  console.log("On dashboard:", page.url());
  await page.screenshot({ path: `${SHOT_DIR}/final-01-dashboard-sidebar.png`, fullPage: true });

  const navClicks = [
    ["Usage", "/usage"],
    ["Profile", "/profile"],
    ["Reports", "/reports"],
    ["Skin advice", "/skin-advice"],
    ["Privacy", "/privacy"],
    ["Settings", "/account"],
    ["Home", "/dashboard"],
  ];

  for (const [label, expectedPath] of navClicks) {
    await page.click(`aside a:has-text("${label}")`);
    await page.waitForTimeout(1200);
    console.log(`Clicked "${label}" -> ${page.url()} (expected ${expectedPath})`);
    await page.screenshot({ path: `${SHOT_DIR}/final-nav-${label.replace(/\s+/g, "_")}.png`, fullPage: true });
  }

  // account tabs
  await page.click('aside a:has-text("Settings")');
  await page.waitForTimeout(800);
  await page.click('button:has-text("Climate")');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SHOT_DIR}/final-account-climate.png`, fullPage: true });
  await page.click('button:has-text("Your data")');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SHOT_DIR}/final-account-yourdata.png`, fullPage: true });

  console.log("\n=== PAGE ERRORS ===");
  console.log(errors.length ? errors.join("\n") : "none");

  await browser.close();
})();
