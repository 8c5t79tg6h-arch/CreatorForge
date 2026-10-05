import { chromium } from "playwright";

const BASE = process.env.VERIFY_BASE_URL ?? "http://localhost:3000";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const response = await page.request.post(`${BASE}/api/generate`, {
    data: {
      kind: "content-idea",
      input: {
        topic: "stage6 api",
        platform: "YouTube",
        contentType: "Short-form video",
        tone: "Educational",
        count: 3,
      },
    },
  });

  if (!response.ok()) {
    throw new Error(`API failed: ${response.status()}`);
  }

  const json = await response.json();
  if (json.kind !== "content-idea" || !Array.isArray(json.result?.ideas)) {
    throw new Error("Unexpected API payload");
  }

  console.log("stage6-verify: generation service ok");
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
