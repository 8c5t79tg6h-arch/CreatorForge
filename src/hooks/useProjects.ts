"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  type CreateProjectInput,
  type PersistedContent,
  type PersistedContentKind,
  type PersistedProject,
  type SaveContentInput,
  type UpdateProjectInput,
  createProject as createProjectRecord,
  deleteProject as deleteProjectRecord,
  getServerSnapshot,
  getWorkspaceSnapshot,
  listContents,
  listContentsByProject,
  listProjects,
  refreshWorkspace,
  saveContent as saveContentRecord,
  subscribeWorkspace,
  unsaveContent as unsaveContentRecord,
  updateProject as updateProjectRecord,
} from "@/lib/persistence";

export function useWorkspace() {
  return useSyncExternalStore(
    subscribeWorkspace,
    getWorkspaceSnapshot,
    getServerSnapshot,
  );
}

export function useProjects() {
  const workspace = useWorkspace();

  const projects = useMemo(() => listProjects(workspace), [workspace]);
  const contents = useMemo(() => listContents(workspace), [workspace]);

  const createProject = useCallback((input: CreateProjectInput) => {
    const project = createProjectRecord(input);
    refreshWorkspace();
    return project;
  }, []);

  const updateProject = useCallback((id: string, input: UpdateProjectInput) => {
    const project = updateProjectRecord(id, input);
    refreshWorkspace();
    return project;
  }, []);

  const deleteProject = useCallback((id: string) => {
    const ok = deleteProjectRecord(id);
    refreshWorkspace();
    return ok;
  }, []);

  const saveContent = useCallback((input: SaveContentInput) => {
    const content = saveContentRecord(input);
    refreshWorkspace();
    return content;
  }, []);

  const unsaveContent = useCallback((id: string) => {
    const ok = unsaveContentRecord(id);
    refreshWorkspace();
    return ok;
  }, []);

  const saveByKind = useCallback(
    (
      kind: PersistedContentKind,
      title: string,
      payload: PersistedContent["payload"],
      projectId?: string | null,
    ) => {
      return saveContent({ kind, title, payload, projectId });
    },
    [saveContent],
  );

  const getProjectContents = useCallback(
    (projectId: string) => listContentsByProject(projectId, workspace),
    [workspace],
  );

  return {
    projects,
    contents,
    createProject,
    updateProject,
    deleteProject,
    saveContent,
    unsaveContent,
    saveByKind,
    getProjectContents,
  };
}

export type { PersistedProject, PersistedContent };
