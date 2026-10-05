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
import { getToolHrefForKind } from "@/data/tools";
import { useProjects } from "@/hooks/useProjects";
import type {
  CodingPromptResult,
  ContentIdeaInput,
  ContentPlatform,
  ContentTone,
  RobloxGameResult,
  ThirtyDayPlannerResult,
} from "@/lib/domain/types";
import { copyText } from "@/lib/copy";
import { generateViaApi, GenerationServiceError } from "@/lib/generation";
import { CONTENT_PLATFORMS, CONTENT_TONES } from "@/lib/generation/catalog";
import {
  DEFAULT_TAG_OPTIONS,
  type ContentStatus,
  type PersistedContent,
  type PersistedProject,
  type ProjectStatus,
} from "@/lib/persistence";
import { REFINE_PRESETS } from "@/lib/workspace/refine-presets";
import { formatContentForCopy } from "@/lib/workspace/format-content";
import { buildProjectAiContext } from "@/lib/workspace/project-ai-context";
import {
  CONTENT_STATUS_LABELS,
  STATUS_LABELS,
  kindLabel,
  projectPrimaryKind,
} from "@/lib/workspace/query";
import { refineViaApi } from "@/lib/workspace/refine-client";

const fieldClass =
  "w-full rounded-[12px] border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent";

function clonePayload(payload: PersistedContent["payload"]) {
  return structuredClone(payload);
}

type PendingRefine = {
  title: string;
  payload: PersistedContent["payload"];
  instruction: string;
};

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
    linked.find((item) => item.id === project.primaryContentId) ??
    linked[0] ??
    null;
  const kind = projectPrimaryKind(project, contents);
  const toolHref = getToolHrefForKind(kind ?? "content-idea", project.id);

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
  const [contentStatus, setContentStatus] = useState<ContentStatus>(
    primary?.contentStatus ?? "draft",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refineInstruction, setRefineInstruction] = useState<string>(
    REFINE_PRESETS[0],
  );
  const [customRefine, setCustomRefine] = useState("");
  const [refineTone, setRefineTone] = useState<ContentTone | "">("");
  const [refinePlatform, setRefinePlatform] = useState<ContentPlatform | "">(
    "",
  );
  const [pendingRefine, setPendingRefine] = useState<PendingRefine | null>(null);
  const [regenerating, setRegenerating] = useState(false);
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
      contentStatus: primary?.contentStatus ?? "draft",
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
        contentStatus,
      }),
    [name, description, status, favorite, tags, title, payload, contentStatus],
  );

  const saveState = isSaving
    ? "saving"
    : currentSnapshot === baseline
      ? "saved"
      : "unsaved";

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (saveState === "unsaved" || pendingRefine) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [saveState, pendingRefine]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);

  function projectContext() {
    return buildProjectAiContext({
      projectName: name,
      projectDescription: description,
      tags,
      contentTitle: title,
      contentKind: primary?.kind,
      contentStatus,
    });
  }

  function markMetaDirty() {
    setMessage(null);
    setError(null);
  }

  function buildRefineInstruction(): string {
    const base = customRefine.trim() || refineInstruction;
    const extras = [
      refineTone ? `Tone: ${refineTone}` : null,
      refinePlatform ? `Platform: ${refinePlatform}` : null,
    ].filter(Boolean);
    return extras.length ? `${base}\n${extras.join(" · ")}` : base;
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
          contentStatus,
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
        contentStatus,
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
    if (pendingRefine) {
      setError("Accept or discard the current refinement first.");
      return;
    }
    const instruction = buildRefineInstruction();
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const refined = await refineViaApi({
          targetKind: primary.kind,
          instruction,
          title,
          payload,
          projectContext: projectContext(),
        });
        setPendingRefine({
          title: refined.title || title,
          payload: refined.payload,
          instruction,
        });
        setMessage("Review the refined result, then Accept to save a new version.");
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

  async function onCopy() {
    const text = formatContentForCopy(title, payload);
    const ok = await copyText(text);
    setMessage(ok ? "Copied to clipboard" : "Copy failed");
  }

  function onClearEdits() {
    if (!window.confirm("Reset to the last saved version of this content?")) {
      return;
    }
    const snapshot = JSON.parse(baseline) as {
      name: string;
      description: string;
      status: ProjectStatus;
      favorite: boolean;
      tags: string[];
      title: string;
      payload: PersistedContent["payload"] | null;
      contentStatus: ContentStatus;
    };
    setName(snapshot.name);
    setDescription(snapshot.description);
    setStatus(snapshot.status);
    setFavorite(snapshot.favorite);
    setTags(snapshot.tags);
    setTitle(snapshot.title);
    setPayload(snapshot.payload ? clonePayload(snapshot.payload) : null);
    setContentStatus(snapshot.contentStatus);
    setPendingRefine(null);
    setMessage("Edits cleared — back to last saved state");
  }

  function onRegenerate() {
    if (!primary || !payload) return;
    if (pendingRefine) {
      setError("Accept or discard the current refinement first.");
      return;
    }
    const input = (payload as { input?: unknown }).input;
    if (!input || typeof input !== "object") {
      setError("This content has no generation input to regenerate from.");
      return;
    }
    setError(null);
    setMessage(null);
    setRegenerating(true);
    startTransition(async () => {
      try {
        const generated = await generateViaApi({
          kind: primary.kind,
          input: input as ContentIdeaInput,
          projectContext: projectContext(),
        } as Parameters<typeof generateViaApi>[0]);

        let nextPayload: PersistedContent["payload"];
        let nextTitle = title;
        if (generated.kind === "content-idea") {
          nextPayload = {
            input,
            ideas: generated.result.ideas,
          } as PersistedContent["payload"];
          nextTitle = generated.result.ideas[0]?.title || title;
        } else if (generated.kind === "coding-prompt") {
          nextPayload = {
            input,
            result: generated.result,
          } as PersistedContent["payload"];
        } else if (generated.kind === "roblox-game") {
          nextPayload = {
            input,
            result: generated.result,
          } as PersistedContent["payload"];
        } else {
          nextPayload = {
            input,
            result: generated.result,
          } as PersistedContent["payload"];
        }

        setPendingRefine({
          title: nextTitle,
          payload: nextPayload,
          instruction: "Regenerate from original inputs",
        });
        setMessage("Review regenerated content, then Accept to save a new version.");
      } catch (err) {
        setError(
          err instanceof GenerationServiceError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Regenerate failed",
        );
      } finally {
        setRegenerating(false);
      }
    });
  }

  function onAcceptRefine() {
    if (!primary || !pendingRefine) return;
    const saved = saveContent({
      id: primary.id,
      kind: primary.kind,
      title: pendingRefine.title,
      payload: pendingRefine.payload,
      projectId: project.id,
      createVersion: true,
      versionSource: "refine",
      versionLabel: pendingRefine.instruction.slice(0, 48),
      contentStatus: "refined",
    });
    const nextStatus = status === "draft" || status === "in_progress"
      ? "in_progress"
      : status;
    updateProject(project.id, {
      status: nextStatus,
      primaryContentId: primary.id,
    });
    setTitle(saved.title);
    setPayload(clonePayload(saved.payload));
    setContentStatus("refined");
    if (status === "draft") setStatus("in_progress");
    setBaseline(
      JSON.stringify({
        name,
        description,
        status: nextStatus,
        favorite,
        tags,
        title: saved.title,
        payload: saved.payload,
        contentStatus: "refined",
      }),
    );
    setPendingRefine(null);
    setMessage("Refinement accepted and saved as a new version");
  }

  function onDiscardRefine() {
    setPendingRefine(null);
    setMessage("Refinement discarded — original content unchanged");
  }

  function onRestore(versionId: string) {
    if (!primary) return;
    if (
      (saveState === "unsaved" || pendingRefine) &&
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
    setContentStatus(restored.contentStatus);
    setPendingRefine(null);
    setBaseline(
      JSON.stringify({
        name,
        description,
        status,
        favorite,
        tags,
        title: restored.title,
        payload: restored.payload,
        contentStatus: restored.contentStatus,
      }),
    );
    setMessage("Version restored");
  }

  function selectContent(contentId: string) {
    if (
      (saveState === "unsaved" || pendingRefine) &&
      !window.confirm("Switch content and discard unsaved changes?")
    ) {
      return;
    }
    updateProject(project.id, { primaryContentId: contentId });
  }

  const versions = primary?.versions.slice().reverse() ?? [];

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
            <Link
              href="/dashboard/projects"
              className="text-muted hover:text-accent"
            >
              ← Workspace
            </Link>
            <Link href="/dashboard" className="text-muted hover:text-accent">
              Overview
            </Link>
            <Link href="/dashboard/tools" className="text-muted hover:text-accent">
              Tools
            </Link>
          </div>
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

        {(message || error) && (
          <div className="space-y-1">
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
        )}

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
          <Badge tone="warm">{STATUS_LABELS[status]}</Badge>
          {primary ? (
            <Badge tone="accent">
              {CONTENT_STATUS_LABELS[contentStatus]}
            </Badge>
          ) : null}
          {favorite ? <Badge tone="accent">Favorite</Badge> : null}
        </div>
        <p className="text-sm text-muted">
          Created {new Date(project.createdAt).toLocaleString()} · Updated{" "}
          {new Date(project.updatedAt).toLocaleString()}
          {primary
            ? ` · ${primary.versions.length} version${primary.versions.length === 1 ? "" : "s"}`
            : ""}
        </p>
      </section>

      <section className="grid gap-3 rounded-[14px] border border-line bg-bg-elevated p-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-sm font-semibold text-ink">Project status</span>
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
        {primary ? (
          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-sm font-semibold text-ink">
              Content status
            </span>
            <select
              className={fieldClass}
              value={contentStatus}
              onChange={(e) => {
                setContentStatus(e.target.value as ContentStatus);
                markMetaDirty();
              }}
            >
              <option value="draft">Draft</option>
              <option value="in_progress">In Progress</option>
              <option value="refined">Refined</option>
              <option value="ready">Ready</option>
            </select>
          </label>
        ) : null}
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
        {toolHref ? (
          <Link href={toolHref}>
            <Button size="sm" variant="secondary">
              Generate more
            </Button>
          </Link>
        ) : null}
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            if (!window.confirm(`Archive “${name}”?`)) return;
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

      {linked.length > 1 ? (
        <section className="space-y-3">
          <h2 className="font-display text-2xl text-ink">Saved content</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {linked.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectContent(item.id)}
                className={`rounded-[14px] border p-4 text-left transition ${
                  item.id === primary?.id
                    ? "border-accent bg-[var(--accent-soft)]"
                    : "border-line bg-bg-elevated hover:border-accent/40"
                }`}
              >
                <p className="font-display text-lg text-ink">{item.title}</p>
                <p className="mt-1 text-xs text-muted">
                  {kindLabel(item.kind)} ·{" "}
                  {CONTENT_STATUS_LABELS[item.contentStatus]} · Updated{" "}
                  {new Date(item.updatedAt).toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {primary && payload ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl text-ink">Main content</h2>
              <p className="text-sm text-muted">
                Edit directly, refine with AI, then save. Original versions stay
                in history.
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

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={onCopy}
              disabled={!payload}
            >
              Copy
            </Button>
            <Button
              size="sm"
              onClick={onSave}
              disabled={saveState === "saving" || saveState === "saved"}
            >
              {saveState === "saving" ? "Saving…" : "Save"}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={onRefine}
              disabled={pending || regenerating || !payload || !!pendingRefine}
            >
              {pending ? "Refining…" : "Refine"}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={onRegenerate}
              disabled={pending || regenerating || !payload || !!pendingRefine}
            >
              {regenerating ? "Regenerating…" : "Regenerate"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearEdits}
              disabled={saveState === "saved" && !pendingRefine}
            >
              Clear edits
            </Button>
          </div>

          {primary.kind === "content-idea" ? (
            <ContentIdeaEditor
              ideas={
                ((payload as { ideas?: EditableIdea[] }).ideas ??
                  []) as EditableIdea[]
              }
              onChange={(ideas) => {
                setPayload({
                  ...(payload as object),
                  ideas,
                } as PersistedContent["payload"]);
                markMetaDirty();
              }}
            />
          ) : null}
          {primary.kind === "coding-prompt" ? (
            <CodingPromptEditor
              result={(payload as { result: CodingPromptResult }).result}
              onChange={(result) => {
                setPayload({
                  ...(payload as object),
                  result,
                } as PersistedContent["payload"]);
                markMetaDirty();
              }}
            />
          ) : null}
          {primary.kind === "roblox-game" ? (
            <RobloxGameEditor
              result={(payload as { result: RobloxGameResult }).result}
              onChange={(result) => {
                setPayload({
                  ...(payload as object),
                  result,
                } as PersistedContent["payload"]);
                markMetaDirty();
              }}
            />
          ) : null}
          {primary.kind === "thirty-day-planner" ? (
            <ThirtyDayPlannerEditor
              result={(payload as { result: ThirtyDayPlannerResult }).result}
              onChange={(result) => {
                setPayload({
                  ...(payload as object),
                  result,
                } as PersistedContent["payload"]);
                markMetaDirty();
              }}
            />
          ) : null}
        </section>
      ) : (
        <div className="rounded-[14px] border border-dashed border-line bg-bg-elevated p-6">
          <h2 className="font-display text-2xl text-ink">
            No generated content yet
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Generate from a CreatorForge tool and save into this project. Your
            work will show up here ready to edit and refine.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={toolHref ?? "/dashboard/tools"}>
              <Button size="sm">Open tools</Button>
            </Link>
            <Link href="/dashboard/tools/content-idea-generator">
              <Button size="sm" variant="secondary">
                Content ideas
              </Button>
            </Link>
          </div>
        </div>
      )}

      {primary ? (
        <section className="space-y-4 rounded-[14px] border border-line bg-bg-elevated p-4">
          <div>
            <h2 className="font-display text-2xl text-ink">Refine with AI</h2>
            <p className="mt-1 text-sm text-muted">
              Choose a preset or write a custom instruction. Review the result
              before it becomes a new version.
            </p>
          </div>
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
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-ink">
                Target tone (optional)
              </span>
              <select
                className={fieldClass}
                value={refineTone}
                onChange={(e) =>
                  setRefineTone(e.target.value as ContentTone | "")
                }
              >
                <option value="">Keep current</option>
                {CONTENT_TONES.map((tone) => (
                  <option key={tone} value={tone}>
                    {tone}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-ink">
                Target platform (optional)
              </span>
              <select
                className={fieldClass}
                value={refinePlatform}
                onChange={(e) =>
                  setRefinePlatform(e.target.value as ContentPlatform | "")
                }
              >
                <option value="">Keep current</option>
                {CONTENT_PLATFORMS.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>
            </label>
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
          <Button
            onClick={onRefine}
            disabled={pending || regenerating || !payload || !!pendingRefine}
          >
            {pending ? "Refining…" : "Refine with AI"}
          </Button>

          {pendingRefine ? (
            <div className="space-y-4 rounded-[12px] border border-accent/40 bg-bg p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-xl text-ink">
                  Review proposed changes
                </h3>
                <Badge tone="accent">{pendingRefine.instruction}</Badge>
              </div>
              <p className="text-sm text-muted">
                Edit the proposed result below before accepting. Your current
                saved content stays unchanged until you accept.
              </p>
              <input
                className={fieldClass}
                value={pendingRefine.title}
                onChange={(e) =>
                  setPendingRefine({
                    ...pendingRefine,
                    title: e.target.value,
                  })
                }
                aria-label="Proposed title"
              />
              {primary.kind === "content-idea" ? (
                <ContentIdeaEditor
                  ideas={
                    ((pendingRefine.payload as { ideas?: EditableIdea[] })
                      .ideas ?? []) as EditableIdea[]
                  }
                  onChange={(ideas) =>
                    setPendingRefine({
                      ...pendingRefine,
                      payload: {
                        ...(pendingRefine.payload as object),
                        ideas,
                      } as PersistedContent["payload"],
                    })
                  }
                />
              ) : null}
              {primary.kind === "coding-prompt" ? (
                <CodingPromptEditor
                  result={
                    (pendingRefine.payload as { result: CodingPromptResult })
                      .result
                  }
                  onChange={(result) =>
                    setPendingRefine({
                      ...pendingRefine,
                      payload: {
                        ...(pendingRefine.payload as object),
                        result,
                      } as PersistedContent["payload"],
                    })
                  }
                />
              ) : null}
              {primary.kind === "roblox-game" ? (
                <RobloxGameEditor
                  result={
                    (pendingRefine.payload as { result: RobloxGameResult })
                      .result
                  }
                  onChange={(result) =>
                    setPendingRefine({
                      ...pendingRefine,
                      payload: {
                        ...(pendingRefine.payload as object),
                        result,
                      } as PersistedContent["payload"],
                    })
                  }
                />
              ) : null}
              {primary.kind === "thirty-day-planner" ? (
                <ThirtyDayPlannerEditor
                  result={
                    (
                      pendingRefine.payload as {
                        result: ThirtyDayPlannerResult;
                      }
                    ).result
                  }
                  onChange={(result) =>
                    setPendingRefine({
                      ...pendingRefine,
                      payload: {
                        ...(pendingRefine.payload as object),
                        result,
                      } as PersistedContent["payload"],
                    })
                  }
                />
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button onClick={onAcceptRefine}>Accept & save version</Button>
                <Button variant="secondary" onClick={onDiscardRefine}>
                  Discard
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {versions.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-display text-2xl text-ink">Version history</h2>
          <p className="text-sm text-muted">
            Original → refined → further refined. Restore any earlier version
            without losing the rest of the history.
          </p>
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
                    {new Date(version.createdAt).toLocaleString()} ·{" "}
                    {version.source}
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

      <div className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-2 rounded-[14px] border border-line bg-bg-elevated/95 p-3 shadow-[var(--shadow)] backdrop-blur sm:hidden">
        <Badge tone={saveState === "unsaved" ? "warm" : "accent"}>
          {pending || regenerating
            ? "Working…"
            : saveState === "saving"
              ? "Saving…"
              : saveState === "unsaved"
                ? "Unsaved"
                : "Saved"}
        </Badge>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={onSave}
            disabled={saveState === "saving" || saveState === "saved"}
          >
            Save
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={onRefine}
            disabled={pending || regenerating || !payload || !!pendingRefine}
          >
            Refine
          </Button>
        </div>
      </div>
    </div>
  );
}
