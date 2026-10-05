"use client";

import { useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SaveDestination } from "@/components/tools/SaveDestination";
import { useProjects } from "@/hooks/useProjects";
import {
  formatPlanAsText,
  regeneratePlannedPost,
} from "@/lib/domain/thirtyDayContentPlanner";
import type {
  ContentPlatform,
  ContentTone,
  PlannedPost,
  PlannerGoal,
  ThirtyDayPlannerInput,
  ThirtyDayPlannerResult,
} from "@/lib/domain/types";
import { copyText } from "@/lib/copy";
import { generateViaApi, GenerationServiceError } from "@/lib/generation";

const platforms: ContentPlatform[] = [
  "YouTube",
  "TikTok",
  "Instagram",
  "LinkedIn",
  "X",
  "Blog",
];

const tones: ContentTone[] = [
  "Educational",
  "Entertaining",
  "Inspirational",
  "Professional",
  "Casual",
  "Bold",
];

const goals: PlannerGoal[] = [
  "Grow audience",
  "Drive sales",
  "Build authority",
  "Stay consistent",
  "Launch product",
];

const fieldClass =
  "w-full rounded-[12px] border border-line bg-bg-elevated px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent";

export function ThirtyDayContentPlannerTool() {
  const { projects, saveByKind } = useProjects();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [lastSavedProjectId, setLastSavedProjectId] = useState<string | null>(
    null,
  );
  const [result, setResult] = useState<ThirtyDayPlannerResult | null>(null);
  const [projectId, setProjectId] = useState("");
  const [input, setInput] = useState<ThirtyDayPlannerInput>({
    niche: "",
    platforms: ["TikTok", "Instagram"],
    postsPerWeek: 5,
    tone: "Educational",
    goal: "Grow audience",
    notes: "",
  });

  const canSubmit = useMemo(
    () => input.niche.trim().length > 0 && input.platforms.length > 0 && !pending,
    [input.niche, input.platforms.length, pending],
  );

  function update<K extends keyof ThirtyDayPlannerInput>(
    key: K,
    value: ThirtyDayPlannerInput[K],
  ) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  function togglePlatform(platform: ContentPlatform) {
    setInput((prev) => {
      const exists = prev.platforms.includes(platform);
      const platformsNext = exists
        ? prev.platforms.filter((item) => item !== platform)
        : [...prev.platforms, platform];
      return { ...prev, platforms: platformsNext };
    });
  }

  function onGenerate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setStatus(null);
    startTransition(async () => {
      try {
        const response = await generateViaApi({
          kind: "thirty-day-planner",
          input,
        });
        if (response.kind !== "thirty-day-planner") {
          throw new Error("Unexpected response kind");
        }
        setResult(response.result);
        setStatus(`Built a ${response.result.posts.length}-day plan`);
      } catch (err) {
        setError(
          err instanceof GenerationServiceError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Generation failed",
        );
      }
    });
  }

  async function onCopyAll() {
    if (!result) return;
    const ok = await copyText(formatPlanAsText(result));
    setStatus(ok ? "Copied full 30-day plan" : "Copy failed");
  }

  async function onCopyDay(post: PlannedPost) {
    const text = `Day ${post.day} · ${post.platform} · ${post.contentType}\n${post.title}\nHook: ${post.hook}\nCTA: ${post.cta}\n${post.notes}`;
    const ok = await copyText(text);
    setStatus(ok ? `Copied day ${post.day}` : "Copy failed");
  }

  function onSave() {
    if (!result) return;
    const saved = saveByKind(
      "thirty-day-planner",
      `${input.niche} · 30-day plan`,
      { input, result },
      projectId || null,
    );
    setProjectId(saved.projectId);
    setLastSavedProjectId(saved.projectId);
    setStatus("Saved 30-day plan to project");
  }

  function onRegenerate(post: PlannedPost) {
    setResult((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        posts: prev.posts.map((item) =>
          item.id === post.id
            ? regeneratePlannedPost(input, item, Date.now())
            : item,
        ),
      };
    });
    setStatus(`Regenerated day ${post.day} locally`);
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <Badge tone="accent">Available</Badge>
        <h1 className="font-display text-4xl tracking-tight text-ink">
          30-Day Content Planner
        </h1>
        <p className="max-w-2xl text-base text-muted">
          Map a full month of posts with hooks, formats, and CTAs across the
          platforms you actually publish on.
        </p>
      </section>

      <form
        onSubmit={onGenerate}
        className="grid gap-4 rounded-[14px] border border-line bg-bg-elevated p-5 shadow-[var(--shadow)] md:grid-cols-2"
      >
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-sm font-semibold text-ink">Niche</span>
          <input
            className={fieldClass}
            value={input.niche}
            onChange={(e) => update("niche", e.target.value)}
            placeholder="e.g. indie SaaS build-in-public"
            required
          />
        </label>

        <fieldset className="space-y-2 md:col-span-2">
          <legend className="text-sm font-semibold text-ink">Platforms</legend>
          <div className="flex flex-wrap gap-2">
            {platforms.map((platform) => {
              const active = input.platforms.includes(platform);
              return (
                <button
                  key={platform}
                  type="button"
                  onClick={() => togglePlatform(platform)}
                  className={`rounded-[10px] border px-3 py-1.5 text-sm transition ${
                    active
                      ? "border-accent bg-[var(--accent-soft)] text-accent"
                      : "border-line bg-bg text-muted hover:border-accent/40"
                  }`}
                >
                  {platform}
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="space-y-1.5">
          <span className="text-sm font-semibold text-ink">Posts per week</span>
          <input
            className={fieldClass}
            type="number"
            min={1}
            max={14}
            value={input.postsPerWeek}
            onChange={(e) => update("postsPerWeek", Number(e.target.value))}
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-semibold text-ink">Tone</span>
          <select
            className={fieldClass}
            value={input.tone}
            onChange={(e) => update("tone", e.target.value as ContentTone)}
          >
            {tones.map((tone) => (
              <option key={tone} value={tone}>
                {tone}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-semibold text-ink">Goal</span>
          <select
            className={fieldClass}
            value={input.goal}
            onChange={(e) => update("goal", e.target.value as PlannerGoal)}
          >
            {goals.map((goal) => (
              <option key={goal} value={goal}>
                {goal}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-sm font-semibold text-ink">Notes (optional)</span>
          <input
            className={fieldClass}
            value={input.notes ?? ""}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Launch week, product name, constraints…"
          />
        </label>
        <SaveDestination
          projects={projects}
          projectId={projectId}
          onProjectIdChange={setProjectId}
          lastSavedProjectId={lastSavedProjectId}
          statusMessage={status}
        />
        <div className="md:col-span-2">
          <Button type="submit" disabled={!canSubmit}>
            {pending ? "Planning…" : "Generate 30-day plan"}
          </Button>
        </div>
      </form>

      {error ? (
        <p className="rounded-[12px] border border-[color-mix(in_srgb,var(--accent-2)_35%,var(--line))] bg-[var(--accent-2-soft)] px-4 py-3 text-sm text-accent-2">
          {error}
        </p>
      ) : null}

      {result ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl text-ink">Your calendar</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted">{result.summary}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={onCopyAll}>
                Copy all
              </Button>
              <Button size="sm" onClick={onSave}>
                Save plan
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {result.posts.map((post) => (
              <article
                key={post.id}
                className="rounded-[14px] border border-line bg-bg-elevated p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Day {post.day}
                  </p>
                  <Badge tone="neutral">{post.platform}</Badge>
                </div>
                <h3 className="mt-2 font-display text-lg text-ink">{post.title}</h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted">
                  {post.contentType}
                </p>
                <p className="mt-2 text-sm text-muted">
                  <span className="font-semibold text-ink">Hook:</span> {post.hook}
                </p>
                <p className="mt-1 text-sm text-muted">
                  <span className="font-semibold text-ink">CTA:</span> {post.cta}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted">{post.notes}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onCopyDay(post)}
                  >
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRegenerate(post)}
                  >
                    Regenerate
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
