"use client";

import type { PlannedPost, ThirtyDayPlannerResult } from "@/lib/domain/types";
import {
  CONTENT_PLATFORMS,
  CONTENT_TYPES,
} from "@/lib/generation/catalog";

const fieldClass =
  "w-full rounded-[12px] border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent";

type Props = {
  result: ThirtyDayPlannerResult;
  onChange: (result: ThirtyDayPlannerResult) => void;
};

export function ThirtyDayPlannerEditor({ result, onChange }: Props) {
  function updatePost(day: number, patch: Partial<PlannedPost>) {
    onChange({
      ...result,
      posts: result.posts.map((post) =>
        post.day === day ? { ...post, ...patch } : post,
      ),
    });
  }

  return (
    <div className="space-y-4">
      <label className="block space-y-1.5 rounded-[14px] border border-line bg-bg-elevated p-4">
        <span className="text-sm font-semibold text-ink">Plan summary</span>
        <textarea
          className={`${fieldClass} min-h-20`}
          value={result.summary}
          onChange={(e) => onChange({ ...result, summary: e.target.value })}
        />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        {result.posts.map((post) => (
          <article
            key={post.id}
            className="space-y-2 rounded-[14px] border border-line bg-bg-elevated p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Day {post.day}
            </p>
            <input
              className={fieldClass}
              value={post.title}
              onChange={(e) => updatePost(post.day, { title: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                className={fieldClass}
                value={post.platform}
                onChange={(e) =>
                  updatePost(post.day, {
                    platform: e.target.value as PlannedPost["platform"],
                  })
                }
              >
                {CONTENT_PLATFORMS.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>
              <select
                className={fieldClass}
                value={post.contentType}
                onChange={(e) =>
                  updatePost(post.day, {
                    contentType: e.target.value as PlannedPost["contentType"],
                  })
                }
              >
                {CONTENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <input
              className={fieldClass}
              value={post.hook}
              onChange={(e) => updatePost(post.day, { hook: e.target.value })}
              placeholder="Hook"
            />
            <input
              className={fieldClass}
              value={post.cta}
              onChange={(e) => updatePost(post.day, { cta: e.target.value })}
              placeholder="CTA"
            />
            <textarea
              className={`${fieldClass} min-h-16`}
              value={post.notes}
              onChange={(e) => updatePost(post.day, { notes: e.target.value })}
              placeholder="Notes"
            />
          </article>
        ))}
      </div>
    </div>
  );
}
