"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ContentIdeaEditor, type EditableIdea } from "@/components/workspace/ContentIdeaEditor";
import { CodingPromptEditor } from "@/components/workspace/CodingPromptEditor";
import { RobloxGameEditor } from "@/components/workspace/RobloxGameEditor";
import { ThirtyDayPlannerEditor } from "@/components/workspace/ThirtyDayPlannerEditor";
import { useProjects } from "@/hooks/useProjects";
import type {
  CodingPromptResult,
  RobloxGameResult,
  ThirtyDayPlannerResult,
} from "@/lib/domain/types";
import { GenerationServiceError } from "@/lib/generation";
import { REFINE_PRESETS } from "@/lib/workspace/refine-presets";
import {
  DEFAULT_TAG_OPTIONS,
  type PersistedContent,
  type PersistedProject,
  type ProjectStatus,
} from "@/lib/persistence";
import { kindLabel, projectPrimaryKind } from "@/lib/workspace/query";
import { refineViaApi } from "@/lib/workspace/refine-client";

const fieldClass =
  "w-full rounded-[12px] border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent";

function clonePayload(payload: PersistedContent["payload"]) {
  return structuredClone(payload);
}

export function ProjectWorkspace({ project }: { project: PersistedProject }) {
  const router = useRouter();
  const {
    contents,
    updateProject,
    archiveProject,
    deleteProject,
    duplicateProject,
    saveContent,
    restoreVersion,
    getProjectContents,
  } = useProjects();

  const linked = getProjectContents(project.id);
  const primary =
    linked.find((item) => item.id === project.primaryContentId) ?? linked[0] ?? null;
  const kind = projectPrimaryKind(project, contents);

  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [favorite, setFavorite] = useState(project.favorite);
  const [tags, setTags] = useState<string[]>(project.tags);
  const [tagDraft, setTagDraft] = useState("");
  const [title, setTitle] = useState(primary?.title ?? project.name);
  const [payload, setPayload] = useState<PersistedContent["payload"] | null>(
    primary ? clonePayload(primary.payload) : null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refineInstruction, setRefineInstruction] = useState<string>(
    REFINE_PRESETS[0],
  );
  const [customRefine, setCustomRefine] = useState("");
  const [pending, startTransition] = useTransition();
  const [baseline, setBaseline] = useState(() =>
    JSON.stringify({
      name: project.name,
      description: project.description,
      status: project.status,
      favorite: project.favorite,
      tags: project.tags,
      title: primary?.title ?? project.name,
      payload: primary?.payload ?? null,
    }),
  );

  const currentSnapshot = useMemo(
    () =>
      JSON.stringify({
        name,
        description,
        status,
        favorite,
        tags,
        title,
        payload,
      }),
    [name, description, status, favorite, tags, title, payload],
  );

  const saveState = isSaving
    ? "saving"
    : currentSnapshot === baseline
      ? "saved"
      : "unsaved";

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (saveState === "unsaved") {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [saveState]);

  function markMetaDirty() {
    setMessage(null);
    setError(null);
  }

  function onSave() {
    setIsSaving(true);
    setError(null);
    try {
      updateProject(project.id, {
        name,
        description,
        status,
        favorite,
        tags,
        primaryContentId: primary?.id ?? project.primaryContentId,
      });
      if (primary && payload) {
        saveContent({
          id: primary.id,
          kind: primary.kind,
          title,
          payload,
          projectId: project.id,
          createVersion: true,
          versionSource: "save",
          versionLabel: "Manual save",
        });
      }
      const nextBaseline = JSON.stringify({
        name,
        description,
        status,
        favorite,
        tags,
        title,
        payload,
      });
      setBaseline(nextBaseline);
      setMessage("Saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  }

  function addTag(tag: string) {
    const next = tag.trim();
    if (!next || tags.includes(next)) return;
    setTags([...tags, next]);
    markMetaDirty();
  }

  function onRefine() {
    if (!primary || !payload) return;
    const instruction = customRefine.trim() || refineInstruction;
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const refined = await refineViaApi({
          targetKind: primary.kind,
          instruction,
          title,
          payload,
        });
        // Create a new version from refine without destroying prior payload.
        const saved = saveContent({
          id: primary.id,
          kind: primary.kind,
          title: refined.title || title,
          payload: refined.payload,
          projectId: project.id,
          createVersion: true,
          versionSource: "refine",
          versionLabel: instruction.slice(0, 48),
        });
        const nextStatus = status === "draft" ? "in_progress" : status;
        updateProject(project.id, { status: nextStatus });
        setTitle(saved.title);
        setPayload(clonePayload(saved.payload));
        setBaseline(
          JSON.stringify({
            name,
            description,
            status: nextStatus,
            favorite,
            tags,
            title: saved.title,
            payload: saved.payload,
          }),
        );
        if (status === "draft") setStatus("in_progress");
        setMessage("Refinement saved as a new version");
      } catch (err) {
        setError(
          err instanceof GenerationServiceError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Refine failed",
        );
      }
    });
  }

  function onRestore(versionId: string) {
    if (!primary) return;
    if (
      saveState === "unsaved" &&
      !window.confirm("Discard unsaved edits and restore this version?")
    ) {
      return;
    }
    const restored = restoreVersion(primary.id, versionId);
    if (!restored) {
      setError("Could not restore version");
      return;
    }
    setTitle(restored.title);
    setPayload(clonePayload(restored.payload));
    setBaseline(
      JSON.stringify({
        name,
        description,
        status,
        favorite,
        tags,
        title: restored.title,
        payload: restored.payload,
      }),
    );
    setMessage("Version restored");
  }

  const versions = primary?.versions.slice().reverse() ?? [];

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard/projects"
            className="text-sm font-semibold text-muted hover:text-accent"
          >
            ← Creator Workspace
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={saveState === "unsaved" ? "warm" : "accent"}>
              {saveState === "saving"
                ? "Saving…"
                : saveState === "unsaved"
                  ? "Unsaved changes"
                  : "Saved"}
            </Badge>
            <Button size="sm" onClick={onSave} disabled={saveState === "saving"}>
              Save
            </Button>
          </div>
        </div>

        <input
          className="w-full border-0 bg-transparent font-display text-3xl tracking-tight text-ink outline-none sm:text-4xl"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            markMetaDirty();
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Badge tone="neutral">{kindLabel(kind)}</Badge>
          <Badge tone="warm">{status.replace("_", " ")}</Badge>
          {favorite ? <Badge tone="accent">Favorite</Badge> : null}
        </div>
        <p className="text-sm text-muted">
          Created {new Date(project.createdAt).toLocaleString()} · Updated{" "}
          {new Date(project.updatedAt).toLocaleString()}
        </p>
      </section>

      <section className="grid gap-3 rounded-[14px] border border-line bg-bg-elevated p-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-sm font-semibold text-ink">Status</span>
          <select
            className={fieldClass}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as ProjectStatus);
              markMetaDirty();
            }}
          >
            <option value="draft">Draft</option>
            <option value="in_progress">In Progress</option>
            <option value="ready">Ready</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-semibold text-ink">Description</span>
          <input
            className={fieldClass}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              markMetaDirty();
            }}
          />
        </label>
        <div className="space-y-2 sm:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-ink">Tags</span>
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                className="rounded-[10px] border border-line px-2 py-1 text-xs text-muted"
                onClick={() => {
                  setTags(tags.filter((item) => item !== tag));
                  markMetaDirty();
                }}
              >
                {tag} ×
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_TAG_OPTIONS.map((tag) => (
              <button
                key={tag}
                type="button"
                className="rounded-[10px] border border-line px-2 py-1 text-xs text-muted hover:border-accent/40"
                onClick={() => addTag(tag)}
              >
                + {tag}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className={fieldClass}
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              placeholder="Custom tag"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                addTag(tagDraft);
                setTagDraft("");
              }}
            >
              Add tag
            </Button>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={favorite ? "primary" : "secondary"}
          onClick={() => {
            setFavorite(!favorite);
            markMetaDirty();
          }}
        >
          {favorite ? "Favorited" : "Favorite"}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            const copy = duplicateProject(project.id);
            if (copy) router.push(`/dashboard/projects/${copy.id}`);
          }}
        >
          Duplicate
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            archiveProject(project.id);
            setStatus("archived");
            setMessage("Archived");
          }}
        >
          Archive
        </Button>
        <Button
          size="sm"
          variant="danger"
          onClick={() => {
            if (
              !window.confirm(
                "Permanently delete this project? Saves become unassigned (not destroyed).",
              )
            ) {
              return;
            }
            deleteProject(project.id);
            router.push("/dashboard/projects");
          }}
        >
          Delete
        </Button>
      </section>

      {primary && payload ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl text-ink">Main content</h2>
              <p className="text-sm text-muted">
                Edit directly. Save creates a version. Refine creates a new
                version without overwriting silently.
              </p>
            </div>
            <input
              className={`${fieldClass} max-w-md`}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                markMetaDirty();
              }}
              aria-label="Content title"
            />
          </div>

          {primary.kind === "content-idea" ? (
            <ContentIdeaEditor
              ideas={((payload as { ideas?: EditableIdea[] }).ideas ?? []) as EditableIdea[]}
              onChange={(ideas) => {
                setPayload({ ...(payload as object), ideas } as PersistedContent["payload"]);
                markMetaDirty();
              }}
            />
          ) : null}
          {primary.kind === "coding-prompt" ? (
            <CodingPromptEditor
              result={(payload as { result: CodingPromptResult }).result}
              onChange={(result) => {
                setPayload({ ...(payload as object), result } as PersistedContent["payload"]);
                markMetaDirty();
              }}
            />
          ) : null}
          {primary.kind === "roblox-game" ? (
            <RobloxGameEditor
              result={(payload as { result: RobloxGameResult }).result}
              onChange={(result) => {
                setPayload({ ...(payload as object), result } as PersistedContent["payload"]);
                markMetaDirty();
              }}
            />
          ) : null}
          {primary.kind === "thirty-day-planner" ? (
            <ThirtyDayPlannerEditor
              result={(payload as { result: ThirtyDayPlannerResult }).result}
              onChange={(result) => {
                setPayload({ ...(payload as object), result } as PersistedContent["payload"]);
                markMetaDirty();
              }}
            />
          ) : null}
        </section>
      ) : (
        <p className="rounded-[14px] border border-line bg-bg-elevated p-5 text-sm text-muted">
          This project has no saved generation yet. Create one from Tools and
          choose this project when saving.
        </p>
      )}

      {primary ? (
        <section className="space-y-4 rounded-[14px] border border-line bg-bg-elevated p-4">
          <h2 className="font-display text-2xl text-ink">Refine with AI</h2>
          <div className="flex flex-wrap gap-2">
            {REFINE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className={`rounded-[10px] border px-3 py-1.5 text-sm ${
                  refineInstruction === preset && !customRefine
                    ? "border-accent bg-[var(--accent-soft)] text-accent"
                    : "border-line text-muted"
                }`}
                onClick={() => {
                  setRefineInstruction(preset);
                  setCustomRefine("");
                }}
              >
                {preset}
              </button>
            ))}
          </div>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-ink">
              Custom instruction
            </span>
            <textarea
              className={`${fieldClass} min-h-20`}
              value={customRefine}
              onChange={(e) => setCustomRefine(e.target.value)}
              placeholder="Make this more appealing to 16–24 year old Roblox players."
            />
          </label>
          <Button onClick={onRefine} disabled={pending || !payload}>
            {pending ? "Refining…" : "Refine with AI"}
          </Button>
        </section>
      ) : null}

      {versions.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-display text-2xl text-ink">Version history</h2>
          <div className="space-y-2">
            {versions.map((version) => (
              <article
                key={version.id}
                className="flex flex-col gap-3 rounded-[14px] border border-line bg-bg-elevated p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-display text-lg text-ink">
                    v{version.versionNumber} · {version.label}
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(version.createdAt).toLocaleString()} · {version.source}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onRestore(version.id)}
                >
                  Restore
                </Button>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {message ? (
        <p className="text-sm text-muted" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-accent-2" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
