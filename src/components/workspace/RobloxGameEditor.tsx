"use client";

import type { RobloxGameResult } from "@/lib/domain/types";

const fieldClass =
  "w-full rounded-[12px] border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent";

type Props = {
  result: RobloxGameResult;
  onChange: (result: RobloxGameResult) => void;
};

const textFields = [
  ["concept", "Concept"],
  ["coreLoop", "Core loop"],
  ["progression", "Progression"],
  ["monetizationPlan", "Monetization"],
  ["mapAndWorld", "Map & world"],
] as const;

const listFields = [
  ["systems", "Systems"],
  ["mvpScope", "MVP scope"],
  ["stretchGoals", "Stretch goals"],
] as const;

export function RobloxGameEditor({ result, onChange }: Props) {
  function updateText(
    key: (typeof textFields)[number][0],
    value: string,
  ) {
    onChange({
      ...result,
      sections: { ...result.sections, [key]: value },
    });
  }

  function updateList(
    key: (typeof listFields)[number][0],
    value: string,
  ) {
    onChange({
      ...result,
      sections: {
        ...result.sections,
        [key]: value
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
      },
    });
  }

  return (
    <div className="space-y-4 rounded-[14px] border border-line bg-bg-elevated p-4">
      {textFields.map(([key, label]) => (
        <label key={key} className="block space-y-1.5">
          <span className="text-sm font-semibold text-ink">{label}</span>
          <textarea
            className={`${fieldClass} min-h-20`}
            value={result.sections[key]}
            onChange={(e) => updateText(key, e.target.value)}
          />
        </label>
      ))}
      {listFields.map(([key, label]) => (
        <label key={key} className="block space-y-1.5">
          <span className="text-sm font-semibold text-ink">
            {label} (one per line)
          </span>
          <textarea
            className={`${fieldClass} min-h-24`}
            value={result.sections[key].join("\n")}
            onChange={(e) => updateList(key, e.target.value)}
          />
        </label>
      ))}
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-ink">Full plan</span>
        <textarea
          className={`${fieldClass} min-h-40`}
          value={result.fullPlan}
          onChange={(e) => onChange({ ...result, fullPlan: e.target.value })}
        />
      </label>
    </div>
  );
}
