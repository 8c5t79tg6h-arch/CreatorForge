import assert from "node:assert/strict";
import { registerServerProviders } from "../src/lib/generation/server-register";
import { runGeneration } from "../src/lib/generation/service";
import { resolveProviderName } from "../src/lib/generation/config";

async function main() {
  registerServerProviders();
  assert.equal(resolveProviderName("mock"), "mock");
  assert.equal(resolveProviderName("openai"), "openai");

  const content = await runGeneration(
    {
      kind: "content-idea",
      input: {
        topic: "stage8",
        platform: "TikTok",
        contentType: "Short-form video",
        tone: "Bold",
        count: 2,
      },
    },
    "mock",
  );
  assert.equal(content.kind, "content-idea");

  const coding = await runGeneration(
    {
      kind: "coding-prompt",
      input: {
        idea: "CLI todo app",
        target: "CLI",
        technology: "Node.js",
        experienceLevel: "Beginner",
        promptStyle: "Concise",
      },
    },
    "mock",
  );
  assert.equal(coding.kind, "coding-prompt");
  assert.ok(coding.result.fullPrompt.includes("Coding Prompt"));

  const roblox = await runGeneration(
    {
      kind: "roblox-game",
      input: {
        idea: "Lava obby",
        genre: "Obby",
        coreGameplay: "parkour across platforms",
        audience: "Kids",
        artStyle: "Cartoon",
        monetization: "Game Passes",
      },
    },
    "mock",
  );
  assert.equal(roblox.kind, "roblox-game");
  assert.ok(roblox.result.fullPlan.includes("Roblox Game Plan"));

  // Provider module must exist for openai structured output path
  await import("../src/lib/generation/openai-provider");

  console.log("stage8-verify: providers + contracts ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
