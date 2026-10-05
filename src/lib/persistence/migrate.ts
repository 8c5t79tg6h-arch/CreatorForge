import { storage } from "./storage";

export const WORKSPACE_KEY = "creatorforge:workspace:v1";
export const WORKSPACE_VERSION = 2;

export type PersistedContentKind =
  | "content-idea"
  | "coding-prompt"
  | "roblox-game"
  | "thirty-day-planner";

export type ProjectStatus = "draft" | "in_progress" | "ready" | "archived";

/** Lightweight pipeline status for individual saved generations. */
export type ContentStatus = "draft" | "in_progress" | "refined" | "ready";

export type VersionSource = "create" | "save" | "refine" | "restore" | "manual";

export type ContentVersion = {
  id: string;
  versionNumber: number;
  createdAt: string;
  source: VersionSource;
  label: string;
  title: string;
  payload: PersistedContent["payload"];
};

export type PersistedProject = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  contentIds: string[];
  /** Workspace fields — optional for v1 compatibility; migrate fills defaults. */
  status: ProjectStatus;
  favorite: boolean;
  tags: string[];
  primaryContentId: string | null;
};

export type PersistedContentBase = {
  id: string;
  projectId: string | null;
  kind: PersistedContentKind;
  title: string;
  createdAt: string;
  updatedAt: string;
  versions: ContentVersion[];
  /** Pipeline status — optional for older saves; migrate fills defaults. */
  contentStatus: ContentStatus;
};

export type PersistedContentIdea = PersistedContentBase & {
  kind: "content-idea";
  payload: {
    input: unknown;
    ideas: unknown[];
  };
};

export type PersistedCodingPrompt = PersistedContentBase & {
  kind: "coding-prompt";
  payload: {
    input: unknown;
    result: unknown;
  };
};

export type PersistedRobloxGame = PersistedContentBase & {
  kind: "roblox-game";
  payload: {
    input: unknown;
    result: unknown;
  };
};

export type PersistedThirtyDayPlanner = PersistedContentBase & {
  kind: "thirty-day-planner";
  payload: {
    input: unknown;
    result: unknown;
  };
};

export type PersistedContent =
  | PersistedContentIdea
  | PersistedCodingPrompt
  | PersistedRobloxGame
  | PersistedThirtyDayPlanner;

export type WorkspaceSnapshot = {
  version: number;
  projects: PersistedProject[];
  contents: PersistedContent[];
};

export const DEFAULT_TAG_OPTIONS = [
  "Roblox",
  "YouTube",
  "TikTok",
  "Gaming",
  "Coding",
  "Fitness",
  "Ideas",
  "Draft",
  "Ready",
] as const;

export function emptyWorkspace(): WorkspaceSnapshot {
  return {
    version: WORKSPACE_VERSION,
    projects: [],
    contents: [],
  };
}

export function migrateWorkspace(raw: unknown): WorkspaceSnapshot {
  if (!raw || typeof raw !== "object") {
    return emptyWorkspace();
  }

  const data = raw as Partial<WorkspaceSnapshot> & { version?: number };
  const version = typeof data.version === "number" ? data.version : 0;

  if (version < 1) {
    return emptyWorkspace();
  }

  const projects = Array.isArray(data.projects)
    ? data.projects.map(normalizeProject).filter(Boolean)
    : [];
  const contents = Array.isArray(data.contents)
    ? data.contents.map(normalizeContent).filter(Boolean)
    : [];

  return {
    version: WORKSPACE_VERSION,
    projects: projects as PersistedProject[],
    contents: contents as PersistedContent[],
  };
}

function normalizeProject(value: unknown): PersistedProject | null {
  if (!value || typeof value !== "object") return null;
  const p = value as Partial<PersistedProject>;
  if (
    typeof p.id !== "string" ||
    typeof p.name !== "string" ||
    typeof p.description !== "string" ||
    typeof p.createdAt !== "string" ||
    typeof p.updatedAt !== "string" ||
    !Array.isArray(p.contentIds)
  ) {
    return null;
  }

  const status = isStatus(p.status) ? p.status : "draft";
  const tags = Array.isArray(p.tags)
    ? p.tags.filter((tag): tag is string => typeof tag === "string")
    : [];

  return {
    id: p.id,
    name: p.name,
    description: p.description,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    contentIds: p.contentIds.filter((id): id is string => typeof id === "string"),
    status,
    favorite: Boolean(p.favorite),
    tags,
    primaryContentId:
      typeof p.primaryContentId === "string" ? p.primaryContentId : null,
  };
}

function normalizeContent(value: unknown): PersistedContent | null {
  if (!value || typeof value !== "object") return null;
  const c = value as Partial<PersistedContent> & { payload?: unknown };
  if (
    typeof c.id !== "string" ||
    !(c.projectId === null || typeof c.projectId === "string") ||
    !(
      c.kind === "content-idea" ||
      c.kind === "coding-prompt" ||
      c.kind === "roblox-game" ||
      c.kind === "thirty-day-planner"
    ) ||
    typeof c.title !== "string" ||
    typeof c.createdAt !== "string" ||
    typeof c.updatedAt !== "string" ||
    typeof c.payload !== "object" ||
    c.payload === null
  ) {
    return null;
  }

  const versions = normalizeVersions(c.versions, c);
  const contentStatus = resolveContentStatus(
    (c as { contentStatus?: unknown }).contentStatus,
    versions,
  );
  return {
    id: c.id,
    projectId: c.projectId,
    kind: c.kind,
    title: c.title,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    payload: c.payload,
    versions,
    contentStatus,
  } as PersistedContent;
}

function resolveContentStatus(
  value: unknown,
  versions: ContentVersion[],
): ContentStatus {
  if (isContentStatus(value)) return value;
  if (versions.some((version) => version.source === "refine")) return "refined";
  if (versions.length > 1) return "in_progress";
  return "draft";
}

function isContentStatus(value: unknown): value is ContentStatus {
  return (
    value === "draft" ||
    value === "in_progress" ||
    value === "refined" ||
    value === "ready"
  );
}

function normalizeVersions(
  raw: unknown,
  content: Partial<PersistedContent> & { payload?: unknown },
): ContentVersion[] {
  if (Array.isArray(raw) && raw.length > 0) {
    return raw
      .map((item, index) => {
        if (!item || typeof item !== "object") return null;
        const v = item as Partial<ContentVersion>;
        if (typeof v.payload !== "object" || v.payload === null) return null;
        return {
          id: typeof v.id === "string" ? v.id : `ver-migrated-${index + 1}`,
          versionNumber:
            typeof v.versionNumber === "number" ? v.versionNumber : index + 1,
          createdAt:
            typeof v.createdAt === "string"
              ? v.createdAt
              : content.createdAt || new Date().toISOString(),
          source: isVersionSource(v.source) ? v.source : "create",
          label: typeof v.label === "string" ? v.label : `Version ${index + 1}`,
          title:
            typeof v.title === "string"
              ? v.title
              : content.title || "Untitled",
          payload: v.payload as PersistedContent["payload"],
        } satisfies ContentVersion;
      })
      .filter(Boolean) as ContentVersion[];
  }

  // Seed v1 for legacy content so version history always exists.
  return [
    {
      id: `ver-seed-${content.id ?? "unknown"}`,
      versionNumber: 1,
      createdAt: content.createdAt || new Date().toISOString(),
      source: "create",
      label: "Original",
      title: content.title || "Untitled",
      payload: content.payload as PersistedContent["payload"],
    },
  ];
}

function isStatus(value: unknown): value is ProjectStatus {
  return (
    value === "draft" ||
    value === "in_progress" ||
    value === "ready" ||
    value === "archived"
  );
}

function isVersionSource(value: unknown): value is VersionSource {
  return (
    value === "create" ||
    value === "save" ||
    value === "refine" ||
    value === "restore" ||
    value === "manual"
  );
}

export function readRawWorkspace(): WorkspaceSnapshot {
  const raw = storage.getItem(WORKSPACE_KEY);
  if (!raw) return emptyWorkspace();
  try {
    return migrateWorkspace(JSON.parse(raw));
  } catch {
    return emptyWorkspace();
  }
}

export function writeRawWorkspace(snapshot: WorkspaceSnapshot): void {
  storage.setItem(WORKSPACE_KEY, JSON.stringify(snapshot));
}
