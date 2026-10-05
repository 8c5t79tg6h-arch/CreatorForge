import { createId } from "./id";
import {
  type PersistedProject,
  type ProjectStatus,
  type WorkspaceSnapshot,
  readRawWorkspace,
  writeRawWorkspace,
} from "./migrate";

export type CreateProjectInput = {
  name: string;
  description?: string;
  status?: ProjectStatus;
  tags?: string[];
  favorite?: boolean;
  primaryContentId?: string | null;
};

export type UpdateProjectInput = {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  tags?: string[];
  favorite?: boolean;
  primaryContentId?: string | null;
};

function nowIso(): string {
  return new Date().toISOString();
}

export function listProjects(
  snapshot: WorkspaceSnapshot = readRawWorkspace(),
): PersistedProject[] {
  return [...snapshot.projects].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

export function getProject(
  id: string,
  snapshot: WorkspaceSnapshot = readRawWorkspace(),
): PersistedProject | undefined {
  return snapshot.projects.find((project) => project.id === id);
}

export function createProject(input: CreateProjectInput): PersistedProject {
  const snapshot = readRawWorkspace();
  const stamp = nowIso();
  const project: PersistedProject = {
    id: createId("proj"),
    name: input.name.trim() || "Untitled project",
    description: input.description?.trim() ?? "",
    createdAt: stamp,
    updatedAt: stamp,
    contentIds: [],
    status: input.status ?? "draft",
    favorite: Boolean(input.favorite),
    tags: input.tags ?? [],
    primaryContentId: input.primaryContentId ?? null,
  };
  snapshot.projects.push(project);
  writeRawWorkspace(snapshot);
  return project;
}

export function updateProject(
  id: string,
  input: UpdateProjectInput,
): PersistedProject | null {
  const snapshot = readRawWorkspace();
  const project = snapshot.projects.find((item) => item.id === id);
  if (!project) return null;
  if (typeof input.name === "string") {
    project.name = input.name.trim() || project.name;
  }
  if (typeof input.description === "string") {
    project.description = input.description.trim();
  }
  if (input.status) project.status = input.status;
  if (typeof input.favorite === "boolean") project.favorite = input.favorite;
  if (Array.isArray(input.tags)) {
    project.tags = input.tags
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 24);
  }
  if (input.primaryContentId !== undefined) {
    project.primaryContentId = input.primaryContentId;
  }
  project.updatedAt = nowIso();
  writeRawWorkspace(snapshot);
  return project;
}

/** Soft cleanup — keeps linked saves, marks archived. */
export function archiveProject(id: string): PersistedProject | null {
  return updateProject(id, { status: "archived" });
}

/**
 * Permanent delete. Unassigns linked content (does not destroy saves)
 * so workspace history remains available as unassigned items.
 */
export function deleteProject(id: string): boolean {
  const snapshot = readRawWorkspace();
  const exists = snapshot.projects.some((project) => project.id === id);
  if (!exists) return false;

  snapshot.projects = snapshot.projects.filter((project) => project.id !== id);
  for (const content of snapshot.contents) {
    if (content.projectId === id) {
      content.projectId = null;
      content.updatedAt = nowIso();
    }
  }
  writeRawWorkspace(snapshot);
  return true;
}

export function duplicateProject(id: string): PersistedProject | null {
  const snapshot = readRawWorkspace();
  const source = snapshot.projects.find((item) => item.id === id);
  if (!source) return null;

  const stamp = nowIso();
  const projectId = createId("proj");
  const contentIdMap = new Map<string, string>();

  const clonedContents = snapshot.contents
    .filter((content) => content.projectId === id)
    .map((content) => {
      const newId = createId("content");
      contentIdMap.set(content.id, newId);
      return {
        ...structuredClone(content),
        id: newId,
        projectId,
        title: `${content.title} (copy)`,
        createdAt: stamp,
        updatedAt: stamp,
        versions: content.versions.map((version, index) => ({
          ...structuredClone(version),
          id: createId("ver"),
          versionNumber: index + 1,
          createdAt: stamp,
          source: "create" as const,
          label: index === 0 ? "Duplicated" : version.label,
        })),
      };
    });

  const project: PersistedProject = {
    ...structuredClone(source),
    id: projectId,
    name: `${source.name} (copy)`,
    createdAt: stamp,
    updatedAt: stamp,
    favorite: false,
    status: source.status === "archived" ? "draft" : source.status,
    contentIds: source.contentIds
      .map((contentId) => contentIdMap.get(contentId))
      .filter((contentId): contentId is string => Boolean(contentId)),
    primaryContentId: source.primaryContentId
      ? (contentIdMap.get(source.primaryContentId) ?? null)
      : (clonedContents[0]?.id ?? null),
  };

  snapshot.projects.push(project);
  snapshot.contents.push(...clonedContents);
  writeRawWorkspace(snapshot);
  return project;
}

export function attachContentToProject(
  projectId: string,
  contentId: string,
): void {
  const snapshot = readRawWorkspace();
  const project = snapshot.projects.find((item) => item.id === projectId);
  const content = snapshot.contents.find((item) => item.id === contentId);
  if (!project || !content) return;

  if (content.projectId && content.projectId !== projectId) {
    const previous = snapshot.projects.find(
      (item) => item.id === content.projectId,
    );
    if (previous) {
      previous.contentIds = previous.contentIds.filter(
        (id) => id !== contentId,
      );
      previous.updatedAt = nowIso();
    }
  }

  content.projectId = projectId;
  content.updatedAt = nowIso();
  if (!project.contentIds.includes(contentId)) {
    project.contentIds.push(contentId);
  }
  if (!project.primaryContentId) {
    project.primaryContentId = contentId;
  }
  project.updatedAt = nowIso();
  writeRawWorkspace(snapshot);
}
