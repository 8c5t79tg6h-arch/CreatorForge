"use client";

import { useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useProjects } from "@/hooks/useProjects";
import type {
  RobloxArtStyle,
  RobloxAudience,
  RobloxGameInput,
  RobloxGameResult,
  RobloxGenre,
  RobloxMonetization,
} from "@/lib/domain/types";
import { copyText } from "@/lib/copy";
import { generateViaApi, GenerationServiceError } from "@/lib/generation";

const genres: RobloxGenre[] = [
  "Obby",
  "Simulator",
  "Tycoon",
  "Horror",
  "Roleplay",
  "Combat",
  "Puzzle",
  "Racing",
];

const audiences: RobloxAudience[] = ["Kids", "Teens", "All ages", "Mature"];
const artStyles: RobloxArtStyle[] = [
  "Low poly",
  "Realistic",
  "Cartoon",
  "Voxel",
  "Stylized",
];
const monetizationOptions: RobloxMonetization[] = [
  "Game Passes",
  "Developer Products",
  "Premium Payouts",
  "Cosmetic Shop",
  "Hybrid",
];

const fieldClass =
  "w-full rounded-[12px] border border-line bg-bg-elevated px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent";

export function RobloxGameBuilderTool() {
  const { projects, saveByKind } = useProjects();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [result, setResult] = useState<RobloxGameResult | null>(null);
  const [projectId, setProjectId] = useState("");
  const [input, setInput] = useState<RobloxGameInput>({
    idea: "",
    genre: "Simulator",
    coreGameplay: "",
    audience: "All ages",
    artStyle: "Cartoon",
    monetization: "Hybrid",
    desiredFeatures: "",
    additionalRequirements: "",
  });

  const canSubmit = useMemo(
    () =>
      input.idea.trim().length > 0 &&
      input.coreGameplay.trim().length > 0 &&
      !pending,
    [input.idea, input.coreGameplay, pending],
  );

  function update<K extends keyof RobloxGameInput>(
    key: K,
    value: RobloxGameInput[K],
  ) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  function runGenerate() {
    setError(null);
    setStatus(null);
    startTransition(async () => {
      try {
        const response = await generateViaApi({
          kind: "roblox-game",
          input,
        });
        if (response.kind !== "roblox-game") {
          throw new Error("Unexpected response kind");
        }
        setResult(response.result);
        setStatus("Game plan ready");
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

  function onGenerate(event: React.FormEvent) {
    event.preventDefault();
    runGenerate();
  }

  async function onCopy() {
    if (!result) return;
    const ok = await copyText(result.fullPlan);
    setStatus(ok ? "Copied full plan" : "Copy failed");
  }

  function onSave() {
    if (!result) return;
    saveByKind(
      "roblox-game",
      input.idea.slice(0, 80) || "Roblox game plan",
      { input, result },
      projectId || null,
    );
    setStatus("Saved Roblox plan");
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <Badge tone="accent">Available</Badge>
        <h1 className="font-display text-4xl tracking-tight text-ink">
          Roblox Game Builder
        </h1>
        <p className="max-w-2xl text-base text-muted">
          Plan a Roblox experience with loops, systems, monetization, and an MVP
          scope you can ship.
        </p>
      </section>

      <form
        onSubmit={onGenerate}
        className="grid gap-4 rounded-[14px] border border-line bg-bg-elevated p-5 shadow-[var(--shadow)] md:grid-cols-2"
      >
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-sm font-semibold text-ink">Idea</span>
          <textarea
            className={`${fieldClass} min-h-24`}
            value={input.idea}
            onChange={(e) => update("idea", e.target.value)}
            placeholder="e.g. a cozy pet café tycoon with events"
            required
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-semibold text-ink">Genre</span>
          <select
            className={fieldClass}
            value={input.genre}
            onChange={(e) => update("genre", e.target.value as RobloxGenre)}
          >
            {genres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-semibold text-ink">Audience</span>
          <select
            className={fieldClass}
            value={input.audience}
            onChange={(e) =>
              update("audience", e.target.value as RobloxAudience)
            }
          >
            {audiences.map((audience) => (
              <option key={audience} value={audience}>
                {audience}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-sm font-semibold text-ink">Core gameplay</span>
          <input
            className={fieldClass}
            value={input.coreGameplay}
            onChange={(e) => update("coreGameplay", e.target.value)}
            placeholder="collect, craft, expand, compete…"
            required
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-semibold text-ink">Art style</span>
          <select
            className={fieldClass}
            value={input.artStyle}
            onChange={(e) =>
              update("artStyle", e.target.value as RobloxArtStyle)
            }
          >
            {artStyles.map((style) => (
              <option key={style} value={style}>
                {style}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-semibold text-ink">Monetization</span>
          <select
            className={fieldClass}
            value={input.monetization}
            onChange={(e) =>
              update("monetization", e.target.value as RobloxMonetization)
            }
          >
            {monetizationOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-sm font-semibold text-ink">Desired features</span>
          <textarea
            className={`${fieldClass} min-h-20`}
            value={input.desiredFeatures}
            onChange={(e) => update("desiredFeatures", e.target.value)}
          />
        </label>
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-sm font-semibold text-ink">
            Additional requirements
          </span>
          <textarea
            className={`${fieldClass} min-h-20`}
            value={input.additionalRequirements}
            onChange={(e) => update("additionalRequirements", e.target.value)}
          />
        </label>
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-sm font-semibold text-ink">
            Save destination project (optional)
          </span>
          <select
            className={fieldClass}
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">Unassigned</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        <div className="md:col-span-2">
          <Button type="submit" disabled={!canSubmit}>
            {pending ? "Generating…" : "Generate game plan"}
          </Button>
        </div>
      </form>

      {error ? (
        <p className="rounded-[12px] border border-[color-mix(in_srgb,var(--accent-2)_35%,var(--line))] bg-[var(--accent-2-soft)] px-4 py-3 text-sm text-accent-2">
          {error}
        </p>
      ) : null}
      {status ? <p className="text-sm text-muted">{status}</p> : null}

      {pending && !result ? (
        <p className="text-sm text-muted">Designing systems…</p>
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
              <h2 className="font-display text-xl text-ink">Concept</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {result.sections.concept}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-ink">Core loop</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {result.sections.coreLoop}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-ink">Systems</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
                {result.sections.systems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-ink">MVP scope</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
                {result.sections.mvpScope.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-ink">Full plan</h3>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-[12px] border border-line bg-bg p-4 text-xs leading-relaxed text-ink">
                {result.fullPlan}
              </pre>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
