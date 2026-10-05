import assert from "node:assert/strict";
import { resetMemoryStorageForTests } from "../src/lib/persistence/storage";
import {
  createProject,
  saveContent,
  updateProject,
  writeRawWorkspace,
  emptyWorkspace,
  readRawWorkspace,
} from "../src/lib/persistence";
import { registerServerProviders } from "../src/lib/generation/server-register";
import { runRefine } from "../src/lib/generation/refine";
import { runGeneration } from "../src/lib/generation/service";
import { buildProjectAiContext } from "../src/lib/workspace/project-ai-context";
import { formatContentForCopy } from "../src/lib/workspace/format-content";
import { validateGenerationRequest } from "../src/lib/generation/validate";

function reset() {
  resetMemoryStorageForTests();
  writeRawWorkspace(emptyWorkspace());
}

async function main() {
  reset();
  registerServerProviders();

  const project = createProject({
    name: "Stage13 Project",
    description: "Gaming creators on TikTok",
    tags: ["TikTok", "Gaming"],
  });

  const context = buildProjectAiContext({
    projectName: project.name,
    projectDescription: project.description,
    tags: project.tags,
    contentTitle: "Hook test",
    contentKind: "content-idea",
    contentStatus: "draft",
  });
  assert.equal(context.projectName, "Stage13 Project");
  assert.ok(context.tags?.includes("TikTok"));

  const request = validateGenerationRequest({
    kind: "content-idea",
    input: {
      topic: "Roblox creator tips",
      platform: "TikTok",
      contentType: "Short-form video",
      tone: "Bold",
      count: 2,
      audience: "16-24 Roblox players",
      goal: "Grow followers",
      customInstructions: "Keep hooks under 12 words",
    },
    projectContext: context,
  });
  assert.equal(request.kind, "content-idea");
  assert.equal(request.projectContext?.projectName, "Stage13 Project");
  if (request.kind === "content-idea") {
    assert.equal(request.input.audience, "16-24 Roblox players");
  }

  const generated = await runGeneration(request, "mock");
  assert.equal(generated.kind, "content-idea");
  assert.ok(generated.result.ideas[0]?.hook);
  assert.ok(generated.result.ideas[0]?.cta);

  const content = saveContent({
    kind: "content-idea",
    title: generated.result.ideas[0]!.title,
    projectId: project.id,
    payload: { input: request.kind === "content-idea" ? request.input : {}, ideas: generated.result.ideas },
    contentStatus: "draft",
  });
  updateProject(project.id, { primaryContentId: content.id });

  const refined = await runRefine({
    targetKind: "content-idea",
    instruction: "Make it more engaging\nTone: Bold · Platform: TikTok",
    title: content.title,
    payload: content.payload,
    projectContext: context,
  });
  assert.ok(refined.title.trim());
  assert.ok(
    Array.isArray((refined.payload as { ideas?: unknown[] }).ideas) &&
      ((refined.payload as { ideas: unknown[] }).ideas.length > 0),
  );

  // Empty refine instruction still rejected
  await assert.rejects(() =>
    runRefine({
      targetKind: "content-idea",
      instruction: "   ",
      title: content.title,
      payload: content.payload,
      projectContext: context,
    }),
  );

  // Persistence untouched by failed refine
  assert.equal(
    readRawWorkspace().contents.find((item) => item.id === content.id)?.title,
    content.title,
  );

  const copy = formatContentForCopy(content.title, content.payload);
  assert.ok(copy.includes(content.title));

  console.log("stage13-verify: AI production upgrade ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
