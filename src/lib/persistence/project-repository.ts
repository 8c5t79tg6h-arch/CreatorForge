import { createId } from "./id";
import {
  type PersistedProject,
  type WorkspaceSnapshot,
  readRawWorkspace,
  writeRawWorkspace,
} from "./migrate";

export type CreateProjectInput = {
  name: string;
  description?: string;
};

export type UpdateProjectInput = {
  name?: string;
  description?: string;
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
  project.updatedAt = nowIso();
  writeRawWorkspace(snapshot);
  return project;
}

export function deleteProject(id: string): boolean {
  const snapshot = readRawWorkspace();
  const exists = snapshot.projects.some((project) => project.id === id);
  if (!exists) return false;

  snapshot.projects = snapshot.projects.filter((project) => project.id !== id);
  snapshot.contents = snapshot.contents.filter(
    (content) => content.projectId !== id,
  );
  writeRawWorkspace(snapshot);
  return true;
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
  project.updatedAt = nowIso();
  writeRawWorkspace(snapshot);
}
