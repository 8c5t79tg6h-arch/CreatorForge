import { chromium } from "playwright";

const BASE = process.env.VERIFY_BASE_URL ?? "http://localhost:3000";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(`${BASE}/dashboard/projects`);
  await page.fill('input[placeholder="Project name"]', "Stage 4 Project");
  await page.fill('input[placeholder="Short description"]', "Persistence check");
  await page.getByRole("button", { name: /create project/i }).click();
  await page.waitForSelector("text=Stage 4 Project");

  await page.goto(`${BASE}/dashboard/tools/content-idea-generator`);
  await page.fill('input[placeholder*="indie SaaS"]', "local storage saves");
  await page.selectOption("select", { label: "Stage 4 Project" }).catch(() => undefined);
  // Choose project by last select on the form
  const selects = page.locator("select");
  const count = await selects.count();
  if (count > 0) {
    await selects.nth(count - 1).selectOption({ label: "Stage 4 Project" });
  }
  await page.getByRole("button", { name: /generate ideas/i }).click();
  await page.waitForSelector("article");
  await page.getByRole("button", { name: /^save$/i }).first().click();
  await page.waitForSelector("text=Saved");

  await page.goto(`${BASE}/dashboard/projects`);
  await page.getByRole("link", { name: /open/i }).first().click();
  await page.waitForSelector("text=Saved content");
  console.log("stage4-verify: persistence ok");

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
