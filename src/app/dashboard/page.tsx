"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PlanBanner } from "@/components/billing/PlanBanner";
import { getAvailableTools, getToolHrefForKind } from "@/data/tools";
import { useProjects } from "@/hooks/useProjects";
import {
  CONTENT_STATUS_LABELS,
  STATUS_LABELS,
  filterAndSortProjects,
  kindLabel,
} from "@/lib/workspace/query";

export default function DashboardPage() {
  const available = getAvailableTools();
  const { projects, contents } = useProjects();
  const recentContents = contents.slice(0, 5);
  const recentProjects = filterAndSortProjects({
    projects,
    contents,
    query: "",
    filter: "all",
    sort: "updated",
  }).slice(0, 4);
  const readyProjects = filterAndSortProjects({
    projects,
    contents,
    query: "",
    filter: "ready",
    sort: "updated",
  }).slice(0, 3);

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">
          Overview
        </p>
        <h1 className="font-display text-4xl tracking-tight text-ink">
          Idea → Generate → Refine → Ready
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted">
          Jump into a generator, save into a project, refine with AI, and keep
          finished work one click away in your Creator Workspace.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/tools">
            <Button size="sm">New generation</Button>
          </Link>
          <Link href="/dashboard/projects">
            <Button size="sm" variant="secondary">
              Open Workspace
            </Button>
          </Link>
        </div>
      </section>

      <PlanBanner compact />

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[14px] border border-line bg-bg-elevated p-5 shadow-[var(--shadow)]">
          <p className="text-sm text-muted">Available tools</p>
          <p className="mt-2 font-display text-3xl text-ink">{available.length}</p>
        </div>
        <div className="rounded-[14px] border border-line bg-bg-elevated p-5 shadow-[var(--shadow)]">
          <p className="text-sm text-muted">Projects</p>
          <p className="mt-2 font-display text-3xl text-ink">
            {projects.filter((project) => project.status !== "archived").length}
          </p>
        </div>
        <div className="rounded-[14px] border border-line bg-bg-elevated p-5 shadow-[var(--shadow)]">
          <p className="text-sm text-muted">Saved items</p>
          <p className="mt-2 font-display text-3xl text-ink">{contents.length}</p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-ink">Recent Projects</h2>
            <p className="mt-1 text-sm text-muted">
              Pick up where you left off in the Creator Workspace.
            </p>
          </div>
          <Link href="/dashboard/projects">
            <Button variant="secondary" size="sm">
              All projects
            </Button>
          </Link>
        </div>
        {recentProjects.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-line bg-bg-elevated p-5">
            <p className="text-sm text-muted">
              No projects yet. Generate from a tool and hit Save to Project.
            </p>
            <div className="mt-3">
              <Link href="/dashboard/tools">
                <Button size="sm">Open tools</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {recentProjects.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="rounded-[14px] border border-line bg-bg-elevated p-4 transition hover:border-accent/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-lg text-ink">{project.name}</h3>
                  <Badge tone="warm">{STATUS_LABELS[project.status]}</Badge>
                </div>
                <p className="mt-2 text-xs text-muted">
                  Updated {new Date(project.updatedAt).toLocaleString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {readyProjects.length > 0 ? (
        <section className="space-y-4">
          <h2 className="font-display text-2xl text-ink">Ready to use</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {readyProjects.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="rounded-[14px] border border-line bg-bg-elevated p-4 transition hover:border-accent/40"
              >
                <h3 className="font-display text-lg text-ink">{project.name}</h3>
                <p className="mt-1 text-xs text-muted">Marked ready</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-ink">Quick start</h2>
            <p className="mt-1 text-sm text-muted">
              Open a tool and generate something useful in under a minute.
            </p>
          </div>
          <Link href="/dashboard/tools">
            <Button variant="secondary" size="sm">
              All tools
            </Button>
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {available.map((tool) => (
            <Link
              key={tool.slug}
              href={tool.href}
              className="rounded-[14px] border border-line bg-bg-elevated p-5 transition hover:border-accent/40 hover:shadow-[var(--shadow)]"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-lg text-ink">{tool.name}</h3>
                <Badge tone="accent">Available</Badge>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {tool.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-ink">Recent saves</h2>
            <p className="mt-1 text-sm text-muted">
              Generated content linked to projects in your workspace.
            </p>
          </div>
          <Link href="/dashboard/projects">
            <Button variant="secondary" size="sm">
              Workspace
            </Button>
          </Link>
        </div>
        {recentContents.length === 0 ? (
          <p className="rounded-[14px] border border-line bg-bg-elevated p-5 text-sm text-muted">
            Nothing saved yet. Generate from a tool and hit Save to Project.
          </p>
        ) : (
          <div className="space-y-3">
            {recentContents.map((content) => {
              const toolHref = getToolHrefForKind(content.kind);
              const projectHref = content.projectId
                ? `/dashboard/projects/${content.projectId}`
                : null;
              return (
                <article
                  key={content.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-line bg-bg-elevated p-4"
                >
                  <div>
                    <h3 className="font-display text-lg text-ink">
                      {content.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted">
                      {kindLabel(content.kind)} ·{" "}
                      {CONTENT_STATUS_LABELS[content.contentStatus]} ·{" "}
                      {new Date(content.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="warm">{content.contentStatus}</Badge>
                    {projectHref ? (
                      <Link href={projectHref}>
                        <Button size="sm">Open project</Button>
                      </Link>
                    ) : null}
                    {toolHref ? (
                      <Link href={toolHref}>
                        <Button size="sm" variant="secondary">
                          Open tool
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
