import assert from "node:assert/strict";
import { resetMemoryStorageForTests } from "../src/lib/persistence/storage";
import {
  archiveProject,
  createProject,
  deleteProject,
  duplicateProject,
  migrateWorkspace,
  restoreContentVersion,
  saveContent,
  updateProject,
  readRawWorkspace,
  writeRawWorkspace,
  emptyWorkspace,
} from "../src/lib/persistence";
import {
  filterAndSortProjects,
  projectPrimaryKind,
} from "../src/lib/workspace/query";
import { registerServerProviders } from "../src/lib/generation/server-register";
import { runRefine } from "../src/lib/generation/refine";
import { runGeneration } from "../src/lib/generation/service";

function reset() {
  resetMemoryStorageForTests();
  writeRawWorkspace(emptyWorkspace());
}

async function main() {
  reset();
  registerServerProviders();

  // Compatibility: v1 project without workspace fields still loads
  const legacy = migrateWorkspace({
    version: 1,
    projects: [
      {
        id: "proj_legacy",
        name: "Legacy",
        description: "old",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        contentIds: ["content_legacy"],
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
      },
    ],
  });
  assert.equal(legacy.projects[0]?.status, "draft");
  assert.equal(legacy.projects[0]?.favorite, false);
  assert.ok(Array.isArray(legacy.projects[0]?.tags));
  assert.equal(legacy.contents[0]?.versions.length, 1);

  reset();

  // Workspace CRUD
  const project = createProject({ name: "Workspace A", description: "demo" });
  const generated = await runGeneration(
    {
      kind: "content-idea",
      input: {
        topic: "workspace",
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
    title: "Workspace ideas",
    projectId: project.id,
    payload: { input: { topic: "workspace" }, ideas: generated.result.ideas },
  });
  updateProject(project.id, {
    primaryContentId: content.id,
    favorite: true,
    tags: ["Ideas", "YouTube"],
    status: "in_progress",
  });

  let snap = readRawWorkspace();
  let loaded = snap.projects.find((item) => item.id === project.id)!;
  assert.equal(loaded.favorite, true);
  assert.deepEqual(loaded.tags, ["Ideas", "YouTube"]);
  assert.equal(loaded.status, "in_progress");
  assert.equal(projectPrimaryKind(loaded, snap.contents), "content-idea");

  // Edit + version
  const edited = saveContent({
    id: content.id,
    kind: "content-idea",
    title: "Workspace ideas edited",
    projectId: project.id,
    payload: {
      input: { topic: "workspace" },
      ideas: generated.result.ideas.map((idea) => ({
        ...idea,
        title: `${idea.title} edited`,
      })),
    },
    versionSource: "save",
    versionLabel: "Manual edit",
  });
  assert.ok(edited.versions.length >= 2);

  // Organization
  updateProject(project.id, { favorite: false, status: "ready" });
  archiveProject(project.id);
  snap = readRawWorkspace();
  loaded = snap.projects.find((item) => item.id === project.id)!;
  assert.equal(loaded.status, "archived");
  assert.equal(loaded.favorite, false);

  updateProject(project.id, { status: "draft", favorite: true });
  const copy = duplicateProject(project.id);
  assert.ok(copy);
  assert.notEqual(copy!.id, project.id);
  assert.ok(copy!.name.includes("copy"));

  // Discovery
  const listed = filterAndSortProjects({
    projects: readRawWorkspace().projects,
    contents: readRawWorkspace().contents,
    query: "youtube",
    filter: "favorites",
    sort: "alpha",
  });
  assert.ok(listed.some((item) => item.id === project.id));

  // Version restore
  const versionId = edited.versions[0]!.id;
  const restored = restoreContentVersion(content.id, versionId);
  assert.ok(restored);
  assert.ok(restored!.versions.some((item) => item.source === "restore"));

  // AI refine creates version and does not wipe on failure path check
  const beforeRefine = readRawWorkspace().contents.find(
    (item) => item.id === content.id,
  )!;
  const refined = await runRefine({
    targetKind: "content-idea",
    instruction: "Make it more engaging",
    title: beforeRefine.title,
    payload: beforeRefine.payload,
  });
  const afterRefineSave = saveContent({
    id: content.id,
    kind: "content-idea",
    title: refined.title,
    payload: refined.payload,
    projectId: project.id,
    versionSource: "refine",
    versionLabel: "Make it more engaging",
  });
  assert.ok(afterRefineSave.versions.some((item) => item.source === "refine"));

  // Failed refine should not be saved — ensure original still loadable
  await assert.rejects(async () => {
    await runRefine({
      targetKind: "content-idea",
      instruction: "",
      title: "x",
      payload: beforeRefine.payload,
    });
  });
  assert.ok(readRawWorkspace().contents.find((item) => item.id === content.id));

  // Delete unassigns rather than destroying content
  const contentCountBefore = readRawWorkspace().contents.length;
  deleteProject(project.id);
  const afterDelete = readRawWorkspace();
  assert.equal(
    afterDelete.contents.length,
    contentCountBefore,
  );
  assert.equal(
    afterDelete.contents.find((item) => item.id === content.id)?.projectId,
    null,
  );

  // Stage 1–9 generation still works
  const planner = await runGeneration(
    {
      kind: "thirty-day-planner",
      input: {
        niche: "stage11",
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

  console.log("stage11-verify: creator workspace ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
