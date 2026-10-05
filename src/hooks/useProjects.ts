"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  type CreateProjectInput,
  type PersistedContent,
  type PersistedContentKind,
  type PersistedProject,
  type SaveContentInput,
  type UpdateProjectInput,
  archiveProject as archiveProjectRecord,
  createProject as createProjectRecord,
  deleteProject as deleteProjectRecord,
  duplicateProject as duplicateProjectRecord,
  getProject,
  getServerSnapshot,
  getWorkspaceSnapshot,
  listContents,
  listContentsByProject,
  listProjects,
  refreshWorkspace,
  restoreContentVersion as restoreContentVersionRecord,
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

  const archiveProject = useCallback((id: string) => {
    const project = archiveProjectRecord(id);
    refreshWorkspace();
    return project;
  }, []);

  const duplicateProject = useCallback((id: string) => {
    const project = duplicateProjectRecord(id);
    refreshWorkspace();
    return project;
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

  const restoreVersion = useCallback((contentId: string, versionId: string) => {
    const content = restoreContentVersionRecord(contentId, versionId);
    refreshWorkspace();
    return content;
  }, []);

  const saveByKind = useCallback(
    (
      kind: PersistedContentKind,
      title: string,
      payload: PersistedContent["payload"],
      projectId?: string | null,
    ) => {
      // Auto-create a project shell when saving without a destination so the
      // Creator Workspace home always has something openable.
      let resolvedProjectId = projectId ?? null;
      let createdProject = false;
      if (!resolvedProjectId) {
        const project = createProjectRecord({
          name: title.trim() || "Untitled project",
          description: `Saved from ${kind}`,
          status: "draft",
          tags: [],
        });
        resolvedProjectId = project.id;
        createdProject = true;
      }

      const existing = getProject(resolvedProjectId);
      const content = saveContentRecord({
        kind,
        title,
        payload,
        projectId: resolvedProjectId,
        contentStatus: "draft",
      });

      // Keep an existing primary content unless this is a brand-new project.
      const nextPrimary =
        createdProject || !existing?.primaryContentId
          ? content.id
          : existing.primaryContentId;

      updateProjectRecord(resolvedProjectId, {
        primaryContentId: nextPrimary,
        status:
          existing?.status === "ready" || existing?.status === "archived"
            ? existing.status
            : existing?.status === "in_progress"
              ? "in_progress"
              : "draft",
      });
      refreshWorkspace();
      return { content, projectId: resolvedProjectId };
    },
    [],
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
    archiveProject,
    duplicateProject,
    saveContent,
    unsaveContent,
    restoreVersion,
    saveByKind,
    getProjectContents,
  };
}

export type { PersistedProject, PersistedContent };
