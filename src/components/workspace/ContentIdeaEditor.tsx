"use client";

import type { ContentIdea } from "@/lib/domain/types";
import {
  CONTENT_PLATFORMS,
  CONTENT_TYPES,
} from "@/lib/generation/catalog";

const fieldClass =
  "w-full rounded-[12px] border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent";

export type EditableIdea = ContentIdea;

type Props = {
  ideas: EditableIdea[];
  onChange: (ideas: EditableIdea[]) => void;
};

export function ContentIdeaEditor({ ideas, onChange }: Props) {
  function update(index: number, patch: Partial<EditableIdea>) {
    onChange(
      ideas.map((idea, i) => (i === index ? { ...idea, ...patch } : idea)),
    );
  }

  return (
    <div className="space-y-4">
      {ideas.map((idea, index) => (
        <article
          key={idea.id || index}
          className="space-y-3 rounded-[14px] border border-line bg-bg-elevated p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Idea {index + 1}
          </p>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-ink">Title</span>
            <input
              className={fieldClass}
              value={idea.title}
              onChange={(e) => update(index, { title: e.target.value })}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-ink">Hook</span>
            <input
              className={fieldClass}
              value={idea.hook ?? ""}
              onChange={(e) => update(index, { hook: e.target.value })}
              placeholder="Opening hook"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-ink">Description</span>
            <textarea
              className={`${fieldClass} min-h-24`}
              value={idea.description}
              onChange={(e) => update(index, { description: e.target.value })}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-ink">Platform</span>
              <select
                className={fieldClass}
                value={idea.platform}
                onChange={(e) => update(index, { platform: e.target.value })}
              >
                {CONTENT_PLATFORMS.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-ink">Format</span>
              <select
                className={fieldClass}
                value={idea.format}
                onChange={(e) => update(index, { format: e.target.value })}
              >
                {CONTENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-ink">Audience</span>
              <input
                className={fieldClass}
                value={idea.audience ?? ""}
                onChange={(e) => update(index, { audience: e.target.value })}
                placeholder="Who it's for"
              />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-sm font-semibold text-ink">CTA</span>
              <input
                className={fieldClass}
                value={idea.cta ?? ""}
                onChange={(e) => update(index, { cta: e.target.value })}
                placeholder="Call to action"
              />
            </label>
            <label className="space-y-1.5 sm:col-span-3">
              <span className="text-sm font-semibold text-ink">
                Improvement notes
              </span>
              <input
                className={fieldClass}
                value={idea.improvementNotes ?? ""}
                onChange={(e) =>
                  update(index, { improvementNotes: e.target.value })
                }
                placeholder="Optional tips to strengthen this idea"
              />
            </label>
          </div>
        </article>
      ))}
    </div>
  );
}
