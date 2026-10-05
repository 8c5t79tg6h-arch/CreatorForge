"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  type PersistedProject,
  useProjects,
} from "@/hooks/useProjects";

function ProjectEditor({ project }: { project: PersistedProject }) {
  const router = useRouter();
  const { getProjectContents, updateProject, deleteProject, unsaveContent } =
    useProjects();
  const contents = getProjectContents(project.id);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [status, setStatus] = useState<string | null>(null);

  function onSaveMeta(event: React.FormEvent) {
    event.preventDefault();
    updateProject(project.id, { name, description });
    setStatus("Project updated");
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <Link
          href="/dashboard/projects"
          className="text-sm font-semibold text-muted hover:text-accent"
        >
          ← Projects
        </Link>
        <h1 className="font-display text-4xl tracking-tight text-ink">
          {project.name}
        </h1>
        <p className="text-base text-muted">
          {project.description || "No description yet."}
        </p>
      </section>

      <form
        onSubmit={onSaveMeta}
        className="grid gap-3 rounded-[14px] border border-line bg-bg-elevated p-5"
      >
        <label className="space-y-1.5">
          <span className="text-sm font-semibold text-ink">Name</span>
          <input
            className="w-full rounded-[12px] border border-line bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-semibold text-ink">Description</span>
          <textarea
            className="min-h-24 w-full rounded-[12px] border border-line bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm">
            Save details
          </Button>
          <Button
            type="button"
            size="sm"
            variant="danger"
            onClick={() => {
              deleteProject(project.id);
              router.push("/dashboard/projects");
            }}
          >
            Delete project
          </Button>
        </div>
        {status ? <p className="text-sm text-muted">{status}</p> : null}
      </form>

      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Saved content</h2>
        {contents.length === 0 ? (
          <p className="text-sm text-muted">
            Nothing saved here yet. Generate from a tool and choose this project.
          </p>
        ) : (
          contents.map((content) => (
            <article
              key={content.id}
              className="rounded-[14px] border border-line bg-bg-elevated p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-xl text-ink">
                    {content.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted">
                    Updated {new Date(content.updatedAt).toLocaleString()}
                  </p>
                </div>
                <Badge tone="warm">{content.kind}</Badge>
              </div>
              <div className="mt-4">
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => unsaveContent(content.id)}
                >
                  Unsave
                </Button>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { projects } = useProjects();

  const project = useMemo(
    () => projects.find((item) => item.id === id),
    [projects, id],
  );

  if (!project) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl text-ink">Project not found</h1>
        <Link href="/dashboard/projects">
          <Button variant="secondary">Back to projects</Button>
        </Link>
      </div>
    );
  }

  return <ProjectEditor key={project.id} project={project} />;
}
