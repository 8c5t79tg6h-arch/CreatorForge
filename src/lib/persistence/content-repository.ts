import { createId } from "./id";
import {
  type PersistedContent,
  type PersistedContentKind,
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

export function saveContent(input: SaveContentInput): PersistedContent {
  const snapshot = readRawWorkspace();
  const stamp = nowIso();
  const existingIndex = input.id
    ? snapshot.contents.findIndex((item) => item.id === input.id)
    : -1;

  const base = {
    id: input.id ?? createId("content"),
    projectId: input.projectId ?? null,
    kind: input.kind,
    title: input.title.trim() || "Untitled save",
    createdAt: stamp,
    updatedAt: stamp,
    payload: input.payload,
  } as PersistedContent;

  if (existingIndex >= 0) {
    const previous = snapshot.contents[existingIndex]!;
    const next = {
      ...base,
      createdAt: previous.createdAt,
      updatedAt: stamp,
    } as PersistedContent;
    snapshot.contents[existingIndex] = next;
    writeRawWorkspace(snapshot);
    if (next.projectId) {
      attachContentToProject(next.projectId, next.id);
    }
    return next;
  }

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
      project.updatedAt = nowIso();
    }
  }
  writeRawWorkspace(snapshot);
  return true;
}

export function saveContentByKind(
  kind: PersistedContentKind,
  title: string,
  payload: PersistedContent["payload"],
  projectId?: string | null,
): PersistedContent {
  return saveContent({ kind, title, payload, projectId });
}
