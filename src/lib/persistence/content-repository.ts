import { createId } from "./id";
import {
  type ContentVersion,
  type PersistedContent,
  type PersistedContentKind,
  type VersionSource,
  type WorkspaceSnapshot,
  readRawWorkspace,
  writeRawWorkspace,
} from "./migrate";
import { attachContentToProject } from "./project-repository";

function nowIso(): string {
  return new Date().toISOString();
}

export type SaveContentInput = {
  kind: PersistedContentKind;
  title: string;
  projectId?: string | null;
  payload: PersistedContent["payload"];
  id?: string;
  /** When true (default for updates), append a version snapshot. */
  createVersion?: boolean;
  versionSource?: VersionSource;
  versionLabel?: string;
};

export function listContents(
  snapshot: WorkspaceSnapshot = readRawWorkspace(),
): PersistedContent[] {
  return [...snapshot.contents].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

export function listContentsByProject(
  projectId: string,
  snapshot: WorkspaceSnapshot = readRawWorkspace(),
): PersistedContent[] {
  return listContents(snapshot).filter(
    (content) => content.projectId === projectId,
  );
}

export function getContent(
  id: string,
  snapshot: WorkspaceSnapshot = readRawWorkspace(),
): PersistedContent | undefined {
  return snapshot.contents.find((content) => content.id === id);
}

function nextVersionNumber(versions: ContentVersion[]): number {
  return versions.reduce((max, item) => Math.max(max, item.versionNumber), 0) + 1;
}

function makeVersion(options: {
  versions: ContentVersion[];
  title: string;
  payload: PersistedContent["payload"];
  source: VersionSource;
  label?: string;
}): ContentVersion {
  const versionNumber = nextVersionNumber(options.versions);
  return {
    id: createId("ver"),
    versionNumber,
    createdAt: nowIso(),
    source: options.source,
    label: options.label || `Version ${versionNumber}`,
    title: options.title,
    payload: structuredClone(options.payload),
  };
}

export function saveContent(input: SaveContentInput): PersistedContent {
  const snapshot = readRawWorkspace();
  const stamp = nowIso();
  const existingIndex = input.id
    ? snapshot.contents.findIndex((item) => item.id === input.id)
    : -1;

  if (existingIndex >= 0) {
    const previous = snapshot.contents[existingIndex]!;
    const versions = [...previous.versions];
    const shouldVersion = input.createVersion !== false;
    if (shouldVersion) {
      versions.push(
        makeVersion({
          versions,
          title: input.title.trim() || previous.title,
          payload: input.payload,
          source: input.versionSource ?? "save",
          label: input.versionLabel,
        }),
      );
    }

    const next = {
      ...previous,
      kind: input.kind,
      title: input.title.trim() || previous.title,
      projectId: input.projectId !== undefined ? input.projectId : previous.projectId,
      payload: input.payload,
      updatedAt: stamp,
      versions,
    } as PersistedContent;

    snapshot.contents[existingIndex] = next;
    writeRawWorkspace(snapshot);
    if (next.projectId) {
      attachContentToProject(next.projectId, next.id);
    }
    return next;
  }

  const initialVersion = makeVersion({
    versions: [],
    title: input.title.trim() || "Untitled save",
    payload: input.payload,
    source: input.versionSource ?? "create",
    label: input.versionLabel || "Original",
  });

  const base = {
    id: input.id ?? createId("content"),
    projectId: input.projectId ?? null,
    kind: input.kind,
    title: input.title.trim() || "Untitled save",
    createdAt: stamp,
    updatedAt: stamp,
    payload: input.payload,
    versions: [initialVersion],
  } as PersistedContent;

  snapshot.contents.push(base);
  writeRawWorkspace(snapshot);
  if (base.projectId) {
    attachContentToProject(base.projectId, base.id);
  }
  return base;
}

export function unsaveContent(id: string): boolean {
  const snapshot = readRawWorkspace();
  const content = snapshot.contents.find((item) => item.id === id);
  if (!content) return false;

  snapshot.contents = snapshot.contents.filter((item) => item.id !== id);
  if (content.projectId) {
    const project = snapshot.projects.find(
      (item) => item.id === content.projectId,
    );
    if (project) {
      project.contentIds = project.contentIds.filter(
        (contentId) => contentId !== id,
      );
      if (project.primaryContentId === id) {
        project.primaryContentId = project.contentIds[0] ?? null;
      }
      project.updatedAt = nowIso();
    }
  }
  writeRawWorkspace(snapshot);
  return true;
}

export function restoreContentVersion(
  contentId: string,
  versionId: string,
): PersistedContent | null {
  const snapshot = readRawWorkspace();
  const content = snapshot.contents.find((item) => item.id === contentId);
  if (!content) return null;
  const version = content.versions.find((item) => item.id === versionId);
  if (!version) return null;

  const restored = makeVersion({
    versions: content.versions,
    title: version.title,
    payload: version.payload,
    source: "restore",
    label: `Restored v${version.versionNumber}`,
  });

  content.title = version.title;
  content.payload = structuredClone(version.payload);
  content.versions = [...content.versions, restored];
  content.updatedAt = nowIso();
  writeRawWorkspace(snapshot);

  if (content.projectId) {
    const project = snapshot.projects.find(
      (item) => item.id === content.projectId,
    );
    if (project) {
      project.updatedAt = nowIso();
      writeRawWorkspace(snapshot);
    }
  }

  return content;
}

export function saveContentByKind(
  kind: PersistedContentKind,
  title: string,
  payload: PersistedContent["payload"],
  projectId?: string | null,
): PersistedContent {
  return saveContent({ kind, title, payload, projectId });
}
