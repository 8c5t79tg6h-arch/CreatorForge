import { chromium } from "playwright";

const BASE = process.env.VERIFY_BASE_URL ?? "http://localhost:3000";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(`${BASE}/`);
  await page.waitForSelector("text=CreatorForge");

  await page.goto(`${BASE}/dashboard/tools/content-idea-generator`);
  await page.fill('input[placeholder*="indie SaaS"]', "creator productivity");
  await page.getByRole("button", { name: /generate ideas/i }).click();
  await page.waitForSelector("text=Generated");

  const idea = page.locator("article").first();
  await idea.waitFor();
  console.log("stage3-verify: content idea generator ok");

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
