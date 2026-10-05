"use client";

import type { CodingPromptResult } from "@/lib/domain/types";

const fieldClass =
  "w-full rounded-[12px] border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent";

type Props = {
  result: CodingPromptResult;
  onChange: (result: CodingPromptResult) => void;
};

export function CodingPromptEditor({ result, onChange }: Props) {
  function updateSection<K extends keyof CodingPromptResult["sections"]>(
    key: K,
    value: CodingPromptResult["sections"][K],
  ) {
    onChange({
      ...result,
      sections: { ...result.sections, [key]: value },
    });
  }

  function updateList(
    key: "requirements" | "implementationSteps" | "acceptanceCriteria" | "constraints",
    value: string,
  ) {
    updateSection(
      key,
      value
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    );
  }

  return (
    <div className="space-y-4 rounded-[14px] border border-line bg-bg-elevated p-4">
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-ink">Objective</span>
        <textarea
          className={`${fieldClass} min-h-20`}
          value={result.sections.overview}
          onChange={(e) => updateSection("overview", e.target.value)}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-ink">Prompt</span>
        <textarea
          className={`${fieldClass} min-h-32`}
          value={result.fullPrompt}
          onChange={(e) => onChange({ ...result, fullPrompt: e.target.value })}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-ink">
          Requirements (one per line)
        </span>
        <textarea
          className={`${fieldClass} min-h-24`}
          value={result.sections.requirements.join("\n")}
          onChange={(e) => updateList("requirements", e.target.value)}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-ink">Technical notes</span>
        <textarea
          className={`${fieldClass} min-h-24`}
          value={result.sections.architecture}
          onChange={(e) => updateSection("architecture", e.target.value)}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-ink">
          Implementation steps
        </span>
        <textarea
          className={`${fieldClass} min-h-24`}
          value={result.sections.implementationSteps.join("\n")}
          onChange={(e) => updateList("implementationSteps", e.target.value)}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-ink">
          Acceptance criteria
        </span>
        <textarea
          className={`${fieldClass} min-h-20`}
          value={result.sections.acceptanceCriteria.join("\n")}
          onChange={(e) => updateList("acceptanceCriteria", e.target.value)}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-ink">Constraints</span>
        <textarea
          className={`${fieldClass} min-h-20`}
          value={result.sections.constraints.join("\n")}
          onChange={(e) => updateList("constraints", e.target.value)}
        />
      </label>
    </div>
  );
}
