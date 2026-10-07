"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useProjects } from "@/hooks/useProjects";
import {
  STATUS_LABELS,
  filterAndSortProjects,
  kindLabel,
  projectContentCount,
  projectPrimaryKind,
  type ProjectFilter,
  type ProjectSort,
} from "@/lib/workspace/query";
import type { PersistedProject } from "@/lib/persistence";
import { formatAiError } from "@/lib/billing";
import { PlanBanner } from "@/components/billing/PlanBanner";

const fieldClass =
  "w-full rounded-[12px] border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent";

function ProjectCard({
  project,
  kind,
  contentCount,
  onFavorite,
  onArchive,
}: {
  project: PersistedProject;
  kind: string;
  contentCount: number;
  onFavorite: () => void;
  onArchive: () => void;
}) {
  return (
    <article className="flex flex-col gap-3 rounded-[14px] border border-line bg-bg-elevated p-4 shadow-[var(--shadow)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <h3 className="truncate font-display text-xl text-ink">
            {project.name}
          </h3>
          <div className="flex flex-wrap gap-2">
            <Badge tone="neutral">{kind}</Badge>
            <Badge tone="warm">{STATUS_LABELS[project.status]}</Badge>
            {project.favorite ? <Badge tone="accent">Favorite</Badge> : null}
          </div>
        </div>
        <button
          type="button"
          aria-label={project.favorite ? "Unfavorite" : "Favorite"}
          className="rounded-[10px] border border-line px-2 py-1 text-sm"
          onClick={onFavorite}
        >
          {project.favorite ? "★" : "☆"}
        </button>
      </div>
      {project.tags.length > 0 ? (
        <p className="text-xs text-muted">{project.tags.join(" · ")}</p>
      ) : null}
      <p className="text-xs text-muted">
        {contentCount} saved item{contentCount === 1 ? "" : "s"} · Updated{" "}
        {new Date(project.updatedAt).toLocaleString()}
      </p>
      <div className="flex flex-wrap gap-2">
        <Link href={`/dashboard/projects/${project.id}`}>
          <Button size="sm">Open</Button>
        </Link>
        <Button size="sm" variant="secondary" onClick={onArchive}>
          Archive
        </Button>
      </div>
    </article>
  );
}

function EmptyState({
  title,
  body,
  actionHref,
  actionLabel,
}: {
  title: string;
  body: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="rounded-[14px] border border-dashed border-line bg-bg-elevated p-6">
      <h3 className="font-display text-xl text-ink">{title}</h3>
      <p className="mt-2 max-w-xl text-sm text-muted">{body}</p>
      <div className="mt-4">
        <Link href={actionHref}>
          <Button size="sm">{actionLabel}</Button>
        </Link>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const router = useRouter();
  const {
    projects,
    contents,
    createProject,
    updateProject,
    archiveProject,
  } = useProjects();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ProjectFilter>("all");
  const [sort, setSort] = useState<ProjectSort>("updated");
  const [showByType, setShowByType] = useState(false);

  const visible = useMemo(
    () =>
      filterAndSortProjects({
        projects,
        contents,
        query,
        filter,
        sort,
      }),
    [projects, contents, query, filter, sort],
  );

  const recentProjects = useMemo(
    () =>
      filterAndSortProjects({
        projects,
        contents,
        query: "",
        filter: "all",
        sort: "updated",
      }).slice(0, 6),
    [projects, contents],
  );

  const favorites = useMemo(
    () =>
      filterAndSortProjects({
        projects,
        contents,
        query: "",
        filter: "favorites",
        sort: "updated",
      }).slice(0, 4),
    [projects, contents],
  );

  const readyProjects = useMemo(
    () =>
      filterAndSortProjects({
        projects,
        contents,
        query: "",
        filter: "ready",
        sort: "updated",
      }).slice(0, 4),
    [projects, contents],
  );

  const inProgress = useMemo(
    () =>
      filterAndSortProjects({
        projects,
        contents,
        query: "",
        filter: "in_progress",
        sort: "updated",
      }).slice(0, 4),
    [projects, contents],
  );

  const byType = useMemo(() => {
    const groups: Record<string, PersistedProject[]> = {
      "content-idea": [],
      "coding-prompt": [],
      "roblox-game": [],
      "thirty-day-planner": [],
    };
    for (const project of projects) {
      if (project.status === "archived") continue;
      const kind = projectPrimaryKind(project, contents);
      if (kind) groups[kind]?.push(project);
    }
    return groups;
  }, [projects, contents]);

  const counts = useMemo(() => {
    const active = projects.filter((project) => project.status !== "archived");
    return {
      total: active.length,
      draft: active.filter((project) => project.status === "draft").length,
      inProgress: active.filter((project) => project.status === "in_progress")
        .length,
      ready: active.filter((project) => project.status === "ready").length,
      saved: contents.filter((content) => content.projectId).length,
    };
  }, [projects, contents]);

  function onCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    try {
      const project = createProject({
        name,
        description,
        status: "draft",
        tags: [],
      });
      setName("");
      setDescription("");
      router.push(`/dashboard/projects/${project.id}`);
    } catch (error) {
      window.alert(formatAiError(error, "Could not create project"));
    }
  }

  function renderCard(project: PersistedProject) {
    return (
      <ProjectCard
        key={project.id}
        project={project}
        kind={kindLabel(projectPrimaryKind(project, contents))}
        contentCount={projectContentCount(project, contents)}
        onFavorite={() =>
          updateProject(project.id, { favorite: !project.favorite })
        }
        onArchive={() => {
          if (!window.confirm(`Archive “${project.name}”?`)) return;
          archiveProject(project.id);
        }}
      />
    );
  }

  function renderSection(
    title: string,
    items: PersistedProject[],
    empty?: { title: string; body: string; href: string; label: string },
  ) {
    if (items.length === 0) {
      if (!empty) return null;
      return (
        <section className="space-y-3">
          <h2 className="font-display text-2xl text-ink">{title}</h2>
          <EmptyState
            title={empty.title}
            body={empty.body}
            actionHref={empty.href}
            actionLabel={empty.label}
          />
        </section>
      );
    }
    return (
      <section className="space-y-3">
        <h2 className="font-display text-2xl text-ink">{title}</h2>
        <div className="grid gap-3 sm:grid-cols-2">{items.map(renderCard)}</div>
      </section>
    );
  }

  const filtering = query || filter !== "all" || sort !== "updated";

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">
          Creator Workspace
        </p>
        <h1 className="font-display text-4xl tracking-tight text-ink">
          Continue creating
        </h1>
        <p className="max-w-2xl text-base text-muted">
          Manage projects, open saved generations, refine with AI, and mark work
          ready to use.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge tone="neutral">{counts.total} projects</Badge>
          <Badge tone="warm">{counts.inProgress} in progress</Badge>
          <Badge tone="accent">{counts.ready} ready</Badge>
          <Badge tone="neutral">{counts.saved} saved items</Badge>
        </div>
      </section>

      <PlanBanner compact />

      <form
        onSubmit={onCreate}
        className="grid gap-3 rounded-[14px] border border-line bg-bg-elevated p-4 md:grid-cols-[1fr_1fr_auto]"
      >
        <input
          className={fieldClass}
          placeholder="New project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className={fieldClass}
          placeholder="Short description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Button type="submit">Create & open</Button>
      </form>

      <section className="grid gap-3 rounded-[14px] border border-line bg-bg-elevated p-4 md:grid-cols-3">
        <label className="space-y-1.5 md:col-span-3">
          <span className="text-sm font-semibold text-ink">Search</span>
          <input
            className={fieldClass}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, content, or tags"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-semibold text-ink">Filter</span>
          <select
            className={fieldClass}
            value={filter}
            onChange={(e) => setFilter(e.target.value as ProjectFilter)}
          >
            <option value="all">All</option>
            <option value="favorites">Favorites</option>
            <option value="content-idea">Content Ideas</option>
            <option value="coding-prompt">Coding Prompts</option>
            <option value="roblox-game">Roblox</option>
            <option value="thirty-day-planner">30-Day Planner</option>
            <option value="draft">Draft</option>
            <option value="in_progress">In Progress</option>
            <option value="ready">Ready</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-semibold text-ink">Sort</span>
          <select
            className={fieldClass}
            value={sort}
            onChange={(e) => setSort(e.target.value as ProjectSort)}
          >
            <option value="updated">Recently updated</option>
            <option value="created">Recently created</option>
            <option value="alpha">Alphabetical</option>
          </select>
        </label>
      </section>

      {filtering ? (
        <section className="space-y-3">
          <h2 className="font-display text-2xl text-ink">Results</h2>
          {visible.length === 0 ? (
            <EmptyState
              title="No projects match"
              body="Try a different search, clear filters, or create a new project."
              actionHref="/dashboard/tools"
              actionLabel="Open tools"
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {visible.map(renderCard)}
            </div>
          )}
        </section>
      ) : projects.filter((project) => project.status !== "archived").length ===
        0 ? (
        <EmptyState
          title="No projects yet"
          body="Generate something in Tools and hit Save, or create a blank project above to start organizing your work."
          actionHref="/dashboard/tools"
          actionLabel="Start generating"
        />
      ) : (
        <>
          {renderSection("Recent Projects", recentProjects)}
          {renderSection("In Progress", inProgress, {
            title: "Nothing in progress",
            body: "Open a draft, refine it with AI, or mark a project In Progress when you're actively working.",
            href: "/dashboard/tools",
            label: "Generate content",
          })}
          {renderSection("Ready to use", readyProjects)}
          {renderSection("Favorites", favorites, {
            title: "No favorites yet",
            body: "Star projects you return to often so they stay one click away.",
            href: "/dashboard/projects",
            label: "Browse projects",
          })}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-2xl text-ink">Browse by type</h2>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowByType((value) => !value)}
              >
                {showByType ? "Hide" : "Show"}
              </Button>
            </div>
            {showByType ? (
              <div className="space-y-8">
                {renderSection(
                  "Content Ideas",
                  byType["content-idea"].slice(0, 4),
                )}
                {renderSection(
                  "Coding Prompts",
                  byType["coding-prompt"].slice(0, 4),
                )}
                {renderSection("Roblox", byType["roblox-game"].slice(0, 4))}
                {renderSection(
                  "30-Day Planner",
                  byType["thirty-day-planner"].slice(0, 4),
                )}
              </div>
            ) : (
              <p className="text-sm text-muted">
                Show type groups when you want to browse by Content Ideas,
                Coding Prompts, Roblox, or 30-Day Planner.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
