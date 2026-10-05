"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import type { PersistedProject } from "@/lib/persistence";

const fieldClass =
  "w-full rounded-[12px] border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent";

type Props = {
  projects: PersistedProject[];
  projectId: string;
  onProjectIdChange: (id: string) => void;
  lastSavedProjectId?: string | null;
  statusMessage?: string | null;
};

export function SaveDestination({
  projects,
  projectId,
  onProjectIdChange,
  lastSavedProjectId,
  statusMessage,
}: Props) {
  const activeProjects = projects.filter(
    (project) => project.status !== "archived",
  );

  useEffect(() => {
    if (projectId || typeof window === "undefined") return;
    const fromQuery = new URLSearchParams(window.location.search).get(
      "projectId",
    );
    if (fromQuery) onProjectIdChange(fromQuery);
  }, [projectId, onProjectIdChange]);

  return (
    <div className="space-y-2 md:col-span-2">
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-ink">Save to project</span>
        <select
          className={fieldClass}
          value={projectId}
          onChange={(e) => onProjectIdChange(e.target.value)}
        >
          <option value="">Create new project on save</option>
          {activeProjects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>
      {statusMessage ? (
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
          <span role="status">{statusMessage}</span>
          {lastSavedProjectId ? (
            <Link href={`/dashboard/projects/${lastSavedProjectId}`}>
              <Button size="sm" variant="secondary">
                Open in Workspace
              </Button>
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
