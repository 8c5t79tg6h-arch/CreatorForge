import assert from "node:assert/strict";
import { registerServerProviders } from "../src/lib/generation/server-register";
import { runGeneration, runGenerationFromUnknown } from "../src/lib/generation/service";
import { validateGenerationRequest } from "../src/lib/generation/validate";
import { normalizeGenerationResult } from "../src/lib/generation/normalize";
import { GenerationServiceError } from "../src/lib/generation/types";

async function main() {
  registerServerProviders();

  // Invalid enum rejected at input validation
  assert.throws(
    () =>
      validateGenerationRequest({
        kind: "content-idea",
        input: {
          topic: "x",
          platform: "MySpace",
          contentType: "Short-form video",
          tone: "Educational",
          count: 3,
        },
      }),
    (error: unknown) =>
      error instanceof GenerationServiceError && error.code === "invalid_request",
  );

  // Full engine path through mock provider + normalize
  const content = await runGenerationFromUnknown({
    kind: "content-idea",
    input: {
      topic: "ai engine",
      platform: "TikTok",
      contentType: "Short-form video",
      tone: "Bold",
      count: 3,
    },
  });
  assert.equal(content.kind, "content-idea");
  assert.equal(content.result.ideas.length, 3);

  const coding = await runGeneration(
    {
      kind: "coding-prompt",
      input: {
        idea: "notes CLI",
        target: "CLI",
        technology: "Node.js",
        experienceLevel: "Beginner",
        promptStyle: "Concise",
      },
    },
    "mock",
  );
  assert.equal(coding.kind, "coding-prompt");
  assert.ok(coding.result.sections.acceptanceCriteria.length > 0);
  assert.ok(coding.result.fullPrompt.includes("Coding Prompt"));

  const planner = await runGeneration(
    {
      kind: "thirty-day-planner",
      input: {
        niche: "engine check",
        platforms: ["TikTok"],
        postsPerWeek: 5,
        tone: "Casual",
        goal: "Stay consistent",
      },
    },
    "mock",
  );
  assert.equal(planner.kind, "thirty-day-planner");
  assert.equal(planner.result.posts.length, 30);

  // Normalize repairs incomplete planner payloads
  const repaired = normalizeGenerationResult(
    {
      kind: "thirty-day-planner",
      input: {
        niche: "repair",
        platforms: ["Blog"],
        postsPerWeek: 3,
        tone: "Professional",
        goal: "Build authority",
      },
    },
    {
      summary: "partial",
      posts: [
        {
          id: "only",
          day: 1,
          platform: "Blog",
          contentType: "Article",
          title: "One",
          hook: "Hook",
          cta: "CTA",
          notes: "Note",
        },
      ],
    },
  );
  assert.equal(repaired.kind, "thirty-day-planner");
  assert.equal(repaired.result.posts.length, 30);
  assert.equal(repaired.result.posts[29]?.day, 30);

  // OpenAI provider module remains importable (structured schemas shared)
  await import("../src/lib/generation/openai-provider");
  await import("../src/lib/generation/engine");

  console.log("stage10-verify: real AI generation engine ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
