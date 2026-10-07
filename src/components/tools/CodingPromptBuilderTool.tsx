"use client";

import { useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SaveDestination } from "@/components/tools/SaveDestination";
import { useProjects } from "@/hooks/useProjects";
import type {
  CodingPromptInput,
  CodingPromptResult,
  CodingTarget,
  ExperienceLevel,
  PromptStyle,
} from "@/lib/domain/types";
import { copyText } from "@/lib/copy";
import { generateViaApi } from "@/lib/generation";
import { formatAiError } from "@/lib/billing";

const targets: CodingTarget[] = [
  "Web app",
  "API",
  "CLI",
  "Mobile",
  "Library",
  "Script",
];

const levels: ExperienceLevel[] = ["Beginner", "Intermediate", "Advanced"];
const styles: PromptStyle[] = [
  "Concise",
  "Detailed",
  "Step-by-step",
  "Production-ready",
];

const fieldClass =
  "w-full rounded-[12px] border border-line bg-bg-elevated px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent";

export function CodingPromptBuilderTool() {
  const { projects, saveByKind } = useProjects();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [lastSavedProjectId, setLastSavedProjectId] = useState<string | null>(
    null,
  );
  const [result, setResult] = useState<CodingPromptResult | null>(null);
  const [projectId, setProjectId] = useState("");
  const [input, setInput] = useState<CodingPromptInput>({
    idea: "",
    target: "Web app",
    technology: "Next.js + TypeScript",
    experienceLevel: "Intermediate",
    promptStyle: "Detailed",
    additionalRequirements: "",
  });

  const canSubmit = useMemo(
    () => input.idea.trim().length > 0 && input.technology.trim().length > 0 && !pending,
    [input.idea, input.technology, pending],
  );

  function update<K extends keyof CodingPromptInput>(
    key: K,
    value: CodingPromptInput[K],
  ) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  function runGenerate() {
    setError(null);
    setStatus(null);
    startTransition(async () => {
      try {
        const response = await generateViaApi({
          kind: "coding-prompt",
          input,
        });
        if (response.kind !== "coding-prompt") {
          throw new Error("Unexpected response kind");
        }
        setResult(response.result);
        setStatus("Prompt ready");
      } catch (err) {
        setError(formatAiError(err, "Generation failed"));
      }
    });
  }

  function onGenerate(event: React.FormEvent) {
    event.preventDefault();
    runGenerate();
  }

  async function onCopy() {
    if (!result) return;
    const ok = await copyText(result.fullPrompt);
    setStatus(ok ? "Copied full prompt" : "Copy failed");
  }

  function onSave() {
    if (!result) return;
    const saved = saveByKind(
      "coding-prompt",
      input.idea.slice(0, 80) || "Coding prompt",
      { input, result },
      projectId || null,
    );
    setProjectId(saved.projectId);
    setLastSavedProjectId(saved.projectId);
    setStatus("Saved coding prompt to project");
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <Badge tone="accent">Available</Badge>
        <h1 className="font-display text-4xl tracking-tight text-ink">
          AI Coding Prompt Builder
        </h1>
        <p className="max-w-2xl text-base text-muted">
          Turn a product idea into a structured prompt you can paste into any
          coding assistant.
        </p>
      </section>

      <form
        onSubmit={onGenerate}
        className="grid gap-4 rounded-[14px] border border-line bg-bg-elevated p-5 shadow-[var(--shadow)] md:grid-cols-2"
      >
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-sm font-semibold text-ink">Idea</span>
          <textarea
            className={`${fieldClass} min-h-28`}
            value={input.idea}
            onChange={(e) => update("idea", e.target.value)}
            placeholder="Describe the thing you want built"
            required
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-semibold text-ink">Target</span>
          <select
            className={fieldClass}
            value={input.target}
            onChange={(e) => update("target", e.target.value as CodingTarget)}
          >
            {targets.map((target) => (
              <option key={target} value={target}>
                {target}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-semibold text-ink">Technology</span>
          <input
            className={fieldClass}
            value={input.technology}
            onChange={(e) => update("technology", e.target.value)}
            required
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-semibold text-ink">Experience level</span>
          <select
            className={fieldClass}
            value={input.experienceLevel}
            onChange={(e) =>
              update("experienceLevel", e.target.value as ExperienceLevel)
            }
          >
            {levels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-semibold text-ink">Prompt style</span>
          <select
            className={fieldClass}
            value={input.promptStyle}
            onChange={(e) =>
              update("promptStyle", e.target.value as PromptStyle)
            }
          >
            {styles.map((style) => (
              <option key={style} value={style}>
                {style}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-sm font-semibold text-ink">
            Additional requirements
          </span>
          <textarea
            className={`${fieldClass} min-h-20`}
            value={input.additionalRequirements}
            onChange={(e) => update("additionalRequirements", e.target.value)}
            placeholder="Optional constraints, libraries, or tone"
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
            {pending ? "Generating…" : "Generate prompt"}
          </Button>
        </div>
      </form>

      {error ? (
        <p className="rounded-[12px] border border-[color-mix(in_srgb,var(--accent-2)_35%,var(--line))] bg-[var(--accent-2-soft)] px-4 py-3 text-sm text-accent-2">
          {error}
        </p>
      ) : null}

      {pending && !result ? (
        <p className="text-sm text-muted">Building prompt…</p>
      ) : null}

      {result ? (
        <section className="space-y-4 rounded-[14px] border border-line bg-bg-elevated p-5">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={onCopy}>
              Copy
            </Button>
            <Button size="sm" variant="secondary" onClick={onSave}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={runGenerate} disabled={pending}>
              Regenerate
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="font-display text-xl text-ink">Overview</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {result.sections.overview}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-ink">Requirements</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
                {result.sections.requirements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-ink">Architecture</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {result.sections.architecture}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-ink">Implementation steps</h3>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted">
                {result.sections.implementationSteps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </div>
            <div>
              <h3 className="font-semibold text-ink">Full prompt</h3>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-[12px] border border-line bg-bg p-4 text-xs leading-relaxed text-ink">
                {result.fullPrompt}
              </pre>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
