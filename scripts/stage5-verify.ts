import { chromium } from "playwright";

const BASE = process.env.VERIFY_BASE_URL ?? "http://localhost:3000";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(`${BASE}/dashboard/tools/ai-coding-prompt-builder`);
  await page.fill("textarea", "Build a habit tracker with streaks");
  await page.getByRole("button", { name: /generate prompt/i }).click();
  await page.waitForSelector("text=Prompt ready");
  await page.waitForSelector("text=Full prompt");
  console.log("stage5-verify: coding prompt builder ok");

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
