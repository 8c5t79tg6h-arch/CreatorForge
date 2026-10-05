import { storage } from "./storage";

export const WORKSPACE_KEY = "creatorforge:workspace:v1";
export const WORKSPACE_VERSION = 1;

export type PersistedContentKind =
  | "content-idea"
  | "coding-prompt"
  | "roblox-game";

export type PersistedProject = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  contentIds: string[];
};

export type PersistedContentBase = {
  id: string;
  projectId: string | null;
  kind: PersistedContentKind;
  title: string;
  createdAt: string;
  updatedAt: string;
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

export type PersistedContent =
  | PersistedContentIdea
  | PersistedCodingPrompt
  | PersistedRobloxGame;

export type WorkspaceSnapshot = {
  version: number;
  projects: PersistedProject[];
  contents: PersistedContent[];
};

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

  const projects = Array.isArray(data.projects) ? data.projects : [];
  const contents = Array.isArray(data.contents) ? data.contents : [];

  return {
    version: WORKSPACE_VERSION,
    projects: projects.filter(isProject),
    contents: contents.filter(isContent),
  };
}

function isProject(value: unknown): value is PersistedProject {
  if (!value || typeof value !== "object") return false;
  const p = value as PersistedProject;
  return (
    typeof p.id === "string" &&
    typeof p.name === "string" &&
    typeof p.description === "string" &&
    typeof p.createdAt === "string" &&
    typeof p.updatedAt === "string" &&
    Array.isArray(p.contentIds)
  );
}

function isContent(value: unknown): value is PersistedContent {
  if (!value || typeof value !== "object") return false;
  const c = value as PersistedContent;
  return (
    typeof c.id === "string" &&
    (c.projectId === null || typeof c.projectId === "string") &&
    (c.kind === "content-idea" ||
      c.kind === "coding-prompt" ||
      c.kind === "roblox-game") &&
    typeof c.title === "string" &&
    typeof c.createdAt === "string" &&
    typeof c.updatedAt === "string" &&
    typeof c.payload === "object" &&
    c.payload !== null
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
