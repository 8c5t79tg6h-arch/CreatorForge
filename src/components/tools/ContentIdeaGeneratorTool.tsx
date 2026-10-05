"use client";

import { useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SaveDestination } from "@/components/tools/SaveDestination";
import { useProjects } from "@/hooks/useProjects";
import { regenerateContentIdea } from "@/lib/domain/contentIdeaGenerator";
import type {
  ContentIdea,
  ContentIdeaInput,
  ContentPlatform,
  ContentTone,
  ContentType,
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

const contentTypes: ContentType[] = [
  "Short-form video",
  "Long-form video",
  "Carousel",
  "Thread",
  "Article",
  "Newsletter",
];

const tones: ContentTone[] = [
  "Educational",
  "Entertaining",
  "Inspirational",
  "Professional",
  "Casual",
  "Bold",
];

const fieldClass =
  "w-full rounded-[12px] border border-line bg-bg-elevated px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent";

export function ContentIdeaGeneratorTool() {
  const { projects, saveByKind } = useProjects();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [lastSavedProjectId, setLastSavedProjectId] = useState<string | null>(
    null,
  );
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [projectId, setProjectId] = useState("");
  const [input, setInput] = useState<ContentIdeaInput>({
    topic: "",
    platform: "YouTube",
    contentType: "Short-form video",
    tone: "Educational",
    count: 5,
    audience: "",
    goal: "",
    customInstructions: "",
  });

  const canSubmit = useMemo(
    () => input.topic.trim().length > 0 && !pending,
    [input.topic, pending],
  );

  function update<K extends keyof ContentIdeaInput>(
    key: K,
    value: ContentIdeaInput[K],
  ) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  function onGenerate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setStatus(null);
    startTransition(async () => {
      try {
        const response = await generateViaApi({
          kind: "content-idea",
          input,
        });
        if (response.kind !== "content-idea") {
          throw new Error("Unexpected response kind");
        }
        setIdeas(response.result.ideas);
        setStatus(`Generated ${response.result.ideas.length} ideas`);
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

  async function onCopy(idea: ContentIdea) {
    const text = `${idea.title}\n\n${idea.description}\n\nFormat: ${idea.format}\nPlatform: ${idea.platform}\nKeywords: ${idea.keywords.join(", ")}`;
    const ok = await copyText(text);
    setStatus(ok ? `Copied “${idea.title}”` : "Copy failed");
  }

  function onSave(idea: ContentIdea) {
    const saved = saveByKind(
      "content-idea",
      idea.title,
      { input, ideas: [idea] },
      projectId || null,
    );
    setProjectId(saved.projectId);
    setLastSavedProjectId(saved.projectId);
    setStatus(`Saved “${idea.title}” to project`);
  }

  function onRegenerate(idea: ContentIdea) {
    setIdeas((prev) =>
      prev.map((item) =>
        item.id === idea.id
          ? regenerateContentIdea(input, idea, Date.now())
          : item,
      ),
    );
    setStatus("Regenerated one idea locally");
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <Badge tone="accent">Available</Badge>
        <h1 className="font-display text-4xl tracking-tight text-ink">
          Content Idea Generator
        </h1>
        <p className="max-w-2xl text-base text-muted">
          Describe a topic and get platform-ready ideas with formats and
          keywords.
        </p>
      </section>

      <form
        onSubmit={onGenerate}
        className="grid gap-4 rounded-[14px] border border-line bg-bg-elevated p-5 shadow-[var(--shadow)] md:grid-cols-2"
      >
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-sm font-semibold text-ink">Topic</span>
          <input
            className={fieldClass}
            value={input.topic}
            onChange={(e) => update("topic", e.target.value)}
            placeholder="e.g. shipping indie SaaS in public"
            required
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-semibold text-ink">Platform</span>
          <select
            className={fieldClass}
            value={input.platform}
            onChange={(e) =>
              update("platform", e.target.value as ContentPlatform)
            }
          >
            {platforms.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-semibold text-ink">Content type</span>
          <select
            className={fieldClass}
            value={input.contentType}
            onChange={(e) =>
              update("contentType", e.target.value as ContentType)
            }
          >
            {contentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
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
          <span className="text-sm font-semibold text-ink">Count</span>
          <input
            className={fieldClass}
            type="number"
            min={1}
            max={12}
            value={input.count}
            onChange={(e) => update("count", Number(e.target.value))}
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-semibold text-ink">Audience</span>
          <input
            className={fieldClass}
            value={input.audience ?? ""}
            onChange={(e) => update("audience", e.target.value)}
            placeholder="e.g. indie founders 20–35"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-semibold text-ink">Goal</span>
          <input
            className={fieldClass}
            value={input.goal ?? ""}
            onChange={(e) => update("goal", e.target.value)}
            placeholder="e.g. grow subscribers"
          />
        </label>
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-sm font-semibold text-ink">
            Custom instructions
          </span>
          <input
            className={fieldClass}
            value={input.customInstructions ?? ""}
            onChange={(e) => update("customInstructions", e.target.value)}
            placeholder="Optional constraints or style notes"
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
            {pending ? "Generating…" : "Generate ideas"}
          </Button>
        </div>
      </form>

      {error ? (
        <p className="rounded-[12px] border border-[color-mix(in_srgb,var(--accent-2)_35%,var(--line))] bg-[var(--accent-2-soft)] px-4 py-3 text-sm text-accent-2">
          {error}
        </p>
      ) : null}

      {pending && ideas.length === 0 ? (
        <p className="text-sm text-muted">Forging ideas…</p>
      ) : null}

      <div className="space-y-4">
        {ideas.map((idea) => (
          <article
            key={idea.id}
            className="rounded-[14px] border border-line bg-bg-elevated p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl text-ink">{idea.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {idea.description}
                </p>
              </div>
              <Badge tone="neutral">{idea.platform}</Badge>
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">
              {idea.format}
            </p>
            <p className="mt-2 text-sm text-muted">
              Keywords: {idea.keywords.join(", ")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => onCopy(idea)}>
                Copy
              </Button>
              <Button size="sm" variant="secondary" onClick={() => onSave(idea)}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onRegenerate(idea)}>
                Regenerate
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
