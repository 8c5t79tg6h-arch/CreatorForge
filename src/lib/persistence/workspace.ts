import {
  type WorkspaceSnapshot,
  emptyWorkspace,
  readRawWorkspace,
  writeRawWorkspace,
} from "./migrate";

type Listener = () => void;

const listeners = new Set<Listener>();
let cached: WorkspaceSnapshot | null = null;

export function getWorkspaceSnapshot(): WorkspaceSnapshot {
  if (!cached) {
    cached = readRawWorkspace();
  }
  return cached;
}

export function replaceWorkspace(snapshot: WorkspaceSnapshot): void {
  cached = snapshot;
  writeRawWorkspace(snapshot);
  listeners.forEach((listener) => listener());
}

export function refreshWorkspace(): WorkspaceSnapshot {
  cached = readRawWorkspace();
  listeners.forEach((listener) => listener());
  return cached;
}

export function mutateWorkspace(
  mutator: (snapshot: WorkspaceSnapshot) => void,
): WorkspaceSnapshot {
  const snapshot = structuredClone(getWorkspaceSnapshot());
  mutator(snapshot);
  replaceWorkspace(snapshot);
  return snapshot;
}

export function clearWorkspace(): void {
  replaceWorkspace(emptyWorkspace());
}

export function subscribeWorkspace(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getServerSnapshot(): WorkspaceSnapshot {
  return emptyWorkspace();
}
