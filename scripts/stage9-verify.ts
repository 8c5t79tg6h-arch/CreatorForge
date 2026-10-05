import assert from "node:assert/strict";
import { registerServerProviders } from "../src/lib/generation/server-register";
import { runGeneration } from "../src/lib/generation/service";
import { generateThirtyDayPlan } from "../src/lib/domain/thirtyDayContentPlanner";

async function main() {
  registerServerProviders();

  const local = generateThirtyDayPlan({
    niche: "stage9",
    platforms: ["TikTok", "YouTube"],
    postsPerWeek: 5,
    tone: "Educational",
    goal: "Grow audience",
  });
  assert.equal(local.posts.length, 30);
  assert.equal(local.posts[0]?.day, 1);
  assert.equal(local.posts[29]?.day, 30);

  const generated = await runGeneration(
    {
      kind: "thirty-day-planner",
      input: {
        niche: "creatorforge launch",
        platforms: ["Instagram", "LinkedIn"],
        postsPerWeek: 4,
        tone: "Professional",
        goal: "Build authority",
        notes: "stage9 verify",
      },
    },
    "mock",
  );
  assert.equal(generated.kind, "thirty-day-planner");
  assert.equal(generated.result.posts.length, 30);
  assert.ok(generated.result.summary.toLowerCase().includes("creatorforge"));

  await import("../src/lib/generation/openai-provider");

  console.log("stage9-verify: thirty-day planner ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
