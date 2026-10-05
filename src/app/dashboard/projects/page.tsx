"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useProjects } from "@/hooks/useProjects";
import {
  filterAndSortProjects,
  kindLabel,
  projectPrimaryKind,
  type ProjectFilter,
  type ProjectSort,
} from "@/lib/workspace/query";
import type { PersistedProject } from "@/lib/persistence";

const fieldClass =
  "w-full rounded-[12px] border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent";

function ProjectCard({
  project,
  kind,
  onFavorite,
  onArchive,
}: {
  project: PersistedProject;
  kind: string;
  onFavorite: () => void;
  onArchive: () => void;
}) {
  return (
    <article className="flex flex-col gap-3 rounded-[14px] border border-line bg-bg-elevated p-4 shadow-[var(--shadow)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <h3 className="truncate font-display text-xl text-ink">{project.name}</h3>
          <div className="flex flex-wrap gap-2">
            <Badge tone="neutral">{kind}</Badge>
            <Badge tone="warm">{project.status.replace("_", " ")}</Badge>
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
        Updated {new Date(project.updatedAt).toLocaleString()}
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

export default function ProjectsPage() {
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

  const continueCreating = useMemo(
    () =>
      filterAndSortProjects({
        projects,
        contents,
        query: "",
        filter: "all",
        sort: "updated",
      }).slice(0, 4),
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

  const recent = useMemo(
    () =>
      filterAndSortProjects({
        projects,
        contents,
        query: "",
        filter: "all",
        sort: "created",
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

  function onCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    createProject({ name, description, status: "draft", tags: [] });
    setName("");
    setDescription("");
  }

  function renderSection(title: string, items: PersistedProject[]) {
    if (items.length === 0) return null;
    return (
      <section className="space-y-3">
        <h2 className="font-display text-2xl text-ink">{title}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              kind={kindLabel(projectPrimaryKind(project, contents))}
              onFavorite={() =>
                updateProject(project.id, { favorite: !project.favorite })
              }
              onArchive={() => archiveProject(project.id)}
            />
          ))}
        </div>
      </section>
    );
  }

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
          Open saved work, edit it, refine with AI, and organize with tags,
          favorites, and status.
        </p>
      </section>

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
        <Button type="submit">Create</Button>
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

      {query || filter !== "all" || sort !== "updated" ? (
        <section className="space-y-3">
          <h2 className="font-display text-2xl text-ink">Results</h2>
          {visible.length === 0 ? (
            <p className="text-sm text-muted">No projects match.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {visible.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  kind={kindLabel(projectPrimaryKind(project, contents))}
                  onFavorite={() =>
                    updateProject(project.id, { favorite: !project.favorite })
                  }
                  onArchive={() => archiveProject(project.id)}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          {renderSection("Continue Creating", continueCreating)}
          {renderSection("Favorites", favorites)}
          {renderSection("Recent", recent)}
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
          {projects.length === 0 ? (
            <p className="text-sm text-muted">
              No projects yet. Generate something in Tools and hit Save, or
              create a blank project above.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
