"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useProjects } from "@/hooks/useProjects";

export default function ProjectsPage() {
  const { projects, contents, createProject, deleteProject } = useProjects();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function onCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    createProject({ name, description });
    setName("");
    setDescription("");
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">
          Projects
        </p>
        <h1 className="font-display text-4xl tracking-tight text-ink">
          Saved workspaces
        </h1>
        <p className="max-w-2xl text-base text-muted">
          Group generated content into projects. Everything stays in local
          storage on this device.
        </p>
      </section>

      <form
        onSubmit={onCreate}
        className="grid gap-3 rounded-[14px] border border-line bg-bg-elevated p-5 md:grid-cols-[1fr_1fr_auto]"
      >
        <input
          className="rounded-[12px] border border-line bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
          placeholder="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="rounded-[12px] border border-line bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
          placeholder="Short description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Button type="submit">Create project</Button>
      </form>

      {projects.length === 0 ? (
        <p className="text-sm text-muted">
          No projects yet. Create one to start saving generations.
        </p>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => {
            const count = contents.filter(
              (content) => content.projectId === project.id,
            ).length;
            return (
              <div
                key={project.id}
                className="flex flex-col gap-4 rounded-[14px] border border-line bg-bg-elevated p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl text-ink">
                      {project.name}
                    </h2>
                    <Badge tone="neutral">{count} saves</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {project.description || "No description"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/dashboard/projects/${project.id}`}>
                    <Button size="sm" variant="secondary">
                      Open
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => deleteProject(project.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
