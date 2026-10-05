import { chromium } from "playwright";

const BASE = process.env.VERIFY_BASE_URL ?? "http://localhost:3000";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(`${BASE}/dashboard/tools/roblox-game-builder`);
  await page.locator("textarea").first().fill("Pet café tycoon");
  await page.fill('input[placeholder*="collect"]', "serve customers and expand");
  await page.getByRole("button", { name: /generate game plan/i }).click();
  await page.waitForSelector("text=Game plan ready");
  await page.waitForSelector("text=Full plan");
  console.log("stage7-verify: roblox game builder ok");

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
