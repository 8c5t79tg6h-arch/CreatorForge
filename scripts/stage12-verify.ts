import assert from "node:assert/strict";
import { resetMemoryStorageForTests } from "../src/lib/persistence/storage";
import {
  createProject,
  migrateWorkspace,
  restoreContentVersion,
  saveContent,
  updateProject,
  readRawWorkspace,
  writeRawWorkspace,
  emptyWorkspace,
  getProject,
} from "../src/lib/persistence";
import { registerServerProviders } from "../src/lib/generation/server-register";
import { runRefine } from "../src/lib/generation/refine";
import { runGeneration } from "../src/lib/generation/service";
import { filterAndSortProjects } from "../src/lib/workspace/query";

function reset() {
  resetMemoryStorageForTests();
  writeRawWorkspace(emptyWorkspace());
}

async function main() {
  reset();
  registerServerProviders();

  // Compatibility: older content without contentStatus still loads
  const legacy = migrateWorkspace({
    version: 2,
    projects: [
      {
        id: "proj_legacy",
        name: "Legacy",
        description: "old",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        contentIds: ["content_legacy"],
        status: "draft",
        favorite: false,
        tags: [],
        primaryContentId: "content_legacy",
      },
    ],
    contents: [
      {
        id: "content_legacy",
        projectId: "proj_legacy",
        kind: "content-idea",
        title: "Old idea",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        payload: {
          input: { topic: "legacy" },
          ideas: [
            {
              id: "1",
              title: "A",
              description: "B",
              format: "Short-form video",
              platform: "TikTok",
              keywords: ["a"],
            },
          ],
        },
        versions: [
          {
            id: "ver_1",
            versionNumber: 1,
            createdAt: "2026-01-01T00:00:00.000Z",
            source: "create",
            label: "Original",
            title: "Old idea",
            payload: {
              input: { topic: "legacy" },
              ideas: [
                {
                  id: "1",
                  title: "A",
                  description: "B",
                  format: "Short-form video",
                  platform: "TikTok",
                  keywords: ["a"],
                },
              ],
            },
          },
        ],
      },
    ],
  });
  assert.equal(legacy.contents[0]?.contentStatus, "draft");

  reset();

  const project = createProject({ name: "Pipeline", description: "stage12" });
  const generated = await runGeneration(
    {
      kind: "content-idea",
      input: {
        topic: "pipeline",
        platform: "YouTube",
        contentType: "Long-form video",
        tone: "Educational",
        count: 2,
      },
    },
    "mock",
  );
  assert.equal(generated.kind, "content-idea");

  const content = saveContent({
    kind: "content-idea",
    title: "Pipeline ideas",
    projectId: project.id,
    payload: { input: { topic: "pipeline" }, ideas: generated.result.ideas },
    contentStatus: "draft",
  });
  updateProject(project.id, { primaryContentId: content.id });
  assert.equal(content.contentStatus, "draft");

  // Refine preview path: runRefine does not mutate persistence
  const before = readRawWorkspace().contents.find((item) => item.id === content.id)!;
  const refined = await runRefine({
    targetKind: "content-idea",
    instruction: "Make it more engaging",
    title: before.title,
    payload: before.payload,
  });
  assert.ok(refined.payload);
  assert.equal(
    readRawWorkspace().contents.find((item) => item.id === content.id)?.title,
    before.title,
  );

  // Accept refine → new version + contentStatus refined
  const accepted = saveContent({
    id: content.id,
    kind: "content-idea",
    title: refined.title,
    payload: refined.payload,
    projectId: project.id,
    createVersion: true,
    versionSource: "refine",
    versionLabel: "Make it more engaging",
    contentStatus: "refined",
  });
  assert.ok(accepted.versions.some((item) => item.source === "refine"));
  assert.equal(accepted.contentStatus, "refined");
  updateProject(project.id, { status: "in_progress" });

  // Failed refine must not destroy existing project content
  await assert.rejects(async () => {
    await runRefine({
      targetKind: "content-idea",
      instruction: "",
      title: "x",
      payload: before.payload,
    });
  });
  assert.ok(readRawWorkspace().contents.find((item) => item.id === content.id));

  // Mark ready
  const ready = saveContent({
    id: content.id,
    kind: "content-idea",
    title: accepted.title,
    payload: accepted.payload,
    projectId: project.id,
    createVersion: false,
    contentStatus: "ready",
  });
  assert.equal(ready.contentStatus, "ready");
  updateProject(project.id, { status: "ready" });

  // Restore original version keeps history
  const original = accepted.versions.find((item) => item.source === "create");
  assert.ok(original);
  const restored = restoreContentVersion(content.id, original!.id);
  assert.ok(restored);
  assert.ok(restored!.versions.some((item) => item.source === "restore"));

  // Discovery still works for ready projects
  const listed = filterAndSortProjects({
    projects: readRawWorkspace().projects,
    contents: readRawWorkspace().contents,
    query: "pipeline",
    filter: "ready",
    sort: "updated",
  });
  assert.ok(listed.some((item) => item.id === project.id));
  assert.ok(getProject(project.id));

  // Existing generators still work
  const planner = await runGeneration(
    {
      kind: "thirty-day-planner",
      input: {
        niche: "stage12",
        platforms: ["TikTok"],
        postsPerWeek: 4,
        tone: "Bold",
        goal: "Grow audience",
      },
    },
    "mock",
  );
  assert.equal(planner.kind, "thirty-day-planner");
  assert.equal(planner.result.posts.length, 30);

  console.log("stage12-verify: AI content pipeline ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
