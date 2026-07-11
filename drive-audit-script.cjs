const { chromium } = require("playwright");

const SHOT_DIR = "/tmp/claude-1000/-home-emma-AURA/50ff6fea-3aef-41a5-8e91-2216b8f6b615/scratchpad/shots";
require("fs").mkdirSync(SHOT_DIR, { recursive: true });

const BASE = "http://localhost:3000";
const email = `sidebar-audit-${Date.now()}@example.com`;
const password = "TestPass123!";

(async () => {
  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`[console] ${msg.text()}`);
  });

  async function shot(name) {
    await page.screenshot({ path: `${SHOT_DIR}/${name}.png`, fullPage: true });
  }

  // Register throwaway user
  await page.goto(`${BASE}/register`, { waitUntil: "networkidle" });
  await page.fill('input[name="name"], input#name', "Sidebar Audit").catch(() => {});
  await page.fill('input[type="email"]', email);
  const pwFields = await page.$$('input[type="password"]');
  for (const f of pwFields) await f.fill(password);
  await shot("00-register-filled");
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard/, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
  console.log("URL after register:", page.url());
  await shot("01-dashboard");

  const routes = ["/dashboard", "/usage", "/profile", "/reports", "/skin-advice", "/privacy", "/account"];
  for (const route of routes) {
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" }).catch((e) => console.log(`nav error ${route}:`, e.message));
    await page.waitForTimeout(500);
    const title = await page.title().catch(() => "?");
    console.log(`--- ${route} -> ${page.url()} (title: ${title})`);
    await shot(`route-${route.replace(/\//g, "_") || "root"}`);
  }

  // click through account tabs
  await page.goto(`${BASE}/account`, { waitUntil: "networkidle" });
  await shot("account-tab-account");
  await page.click('button:has-text("Climate")').catch((e) => console.log("climate tab click err", e.message));
  await page.waitForTimeout(300);
  await shot("account-tab-climate");
  await page.click('button:has-text("Your data")').catch((e) => console.log("your-data tab click err", e.message));
  await page.waitForTimeout(300);
  await shot("account-tab-your-data");

  console.log("\n=== CONSOLE/PAGE ERRORS ===");
  console.log(errors.length ? errors.join("\n") : "none");

  await browser.close();
})();
