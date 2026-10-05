"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { ProjectWorkspace } from "@/components/workspace/ProjectWorkspace";
import { useProjects } from "@/hooks/useProjects";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { projects, contents } = useProjects();

  const project = useMemo(
    () => projects.find((item) => item.id === id),
    [projects, id],
  );

  if (!project) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl text-ink">Project not found</h1>
        <Link href="/dashboard/projects">
          <Button variant="secondary">Back to workspace</Button>
        </Link>
      </div>
    );
  }

  const primaryId =
    project.primaryContentId ??
    contents.find((item) => item.projectId === project.id)?.id ??
    "empty";

  return (
    <ProjectWorkspace
      key={`${project.id}:${primaryId}`}
      project={project}
    />
  );
}
