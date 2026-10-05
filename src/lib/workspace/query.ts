import type {
  ContentStatus,
  PersistedContent,
  PersistedContentKind,
  PersistedProject,
  ProjectStatus,
} from "@/lib/persistence";

export const KIND_LABELS: Record<PersistedContentKind, string> = {
  "content-idea": "Content Ideas",
  "coding-prompt": "Coding Prompt",
  "roblox-game": "Roblox",
  "thirty-day-planner": "30-Day Planner",
};

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  ready: "Ready",
  archived: "Archived",
};

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  refined: "Refined",
  ready: "Ready",
};

export function kindLabel(kind: PersistedContentKind | null | undefined): string {
  if (!kind) return "Project";
  return KIND_LABELS[kind];
}

export function projectPrimaryKind(
  project: PersistedProject,
  contents: PersistedContent[],
): PersistedContentKind | null {
  const linked = contents.filter((item) => item.projectId === project.id);
  if (project.primaryContentId) {
    const primary = linked.find((item) => item.id === project.primaryContentId);
    if (primary) return primary.kind;
  }
  return linked[0]?.kind ?? null;
}

export function projectContentCount(
  project: PersistedProject,
  contents: PersistedContent[],
): number {
  return contents.filter((item) => item.projectId === project.id).length;
}

export function projectSearchBlob(
  project: PersistedProject,
  contents: PersistedContent[],
): string {
  const linked = contents.filter((item) => item.projectId === project.id);
  const parts = [
    project.name,
    project.description,
    project.tags.join(" "),
    project.status,
    ...linked.map(
      (item) =>
        `${item.title} ${item.contentStatus} ${JSON.stringify(item.payload)}`,
    ),
  ];
  return parts.join(" ").toLowerCase();
}

export type ProjectFilter =
  | "all"
  | "favorites"
  | "content-idea"
  | "coding-prompt"
  | "roblox-game"
  | "thirty-day-planner"
  | "draft"
  | "in_progress"
  | "ready"
  | "archived";

export type ProjectSort = "updated" | "created" | "alpha";

export function filterAndSortProjects(options: {
  projects: PersistedProject[];
  contents: PersistedContent[];
  query: string;
  filter: ProjectFilter;
  sort: ProjectSort;
  includeArchived?: boolean;
}): PersistedProject[] {
  const q = options.query.trim().toLowerCase();
  let list = options.projects.filter((project) => {
    if (!options.includeArchived && options.filter !== "archived") {
      if (project.status === "archived") return false;
    }

    if (options.filter === "favorites" && !project.favorite) return false;
    if (options.filter === "draft" && project.status !== "draft") return false;
    if (options.filter === "in_progress" && project.status !== "in_progress") {
      return false;
    }
    if (options.filter === "ready" && project.status !== "ready") return false;
    if (options.filter === "archived" && project.status !== "archived") {
      return false;
    }

    if (
      options.filter === "content-idea" ||
      options.filter === "coding-prompt" ||
      options.filter === "roblox-game" ||
      options.filter === "thirty-day-planner"
    ) {
      if (projectPrimaryKind(project, options.contents) !== options.filter) {
        return false;
      }
    }

    if (!q) return true;
    return projectSearchBlob(project, options.contents).includes(q);
  });

  list = [...list].sort((a, b) => {
    if (options.sort === "alpha") {
      return a.name.localeCompare(b.name);
    }
    if (options.sort === "created") {
      return b.createdAt.localeCompare(a.createdAt);
    }
    return b.updatedAt.localeCompare(a.updatedAt);
  });

  return list;
}
