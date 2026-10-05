import type { PersistedContent } from "@/lib/persistence";

export function formatContentForCopy(
  title: string,
  payload: PersistedContent["payload"] | null,
): string {
  if (!payload) return title;

  if ("ideas" in payload && Array.isArray(payload.ideas)) {
    const ideas = payload.ideas as Array<{
      title?: string;
      hook?: string;
      description?: string;
      platform?: string;
      format?: string;
      audience?: string;
      cta?: string;
      keywords?: string[];
      improvementNotes?: string;
    }>;
    return [
      title,
      "",
      ...ideas.map((idea, index) =>
        [
          `Idea ${index + 1}: ${idea.title ?? ""}`,
          idea.hook ? `Hook: ${idea.hook}` : null,
          idea.description ?? "",
          idea.platform ? `Platform: ${idea.platform}` : null,
          idea.format ? `Format: ${idea.format}` : null,
          idea.audience ? `Audience: ${idea.audience}` : null,
          idea.cta ? `CTA: ${idea.cta}` : null,
          idea.keywords?.length ? `Keywords: ${idea.keywords.join(", ")}` : null,
          idea.improvementNotes
            ? `Notes: ${idea.improvementNotes}`
            : null,
        ]
          .filter(Boolean)
          .join("\n"),
      ),
    ].join("\n\n");
  }

  if ("result" in payload && payload.result && typeof payload.result === "object") {
    const result = payload.result as Record<string, unknown>;
    if (typeof result.fullPrompt === "string") {
      return `${title}\n\n${result.fullPrompt}`;
    }
    if (typeof result.fullPlan === "string") {
      return `${title}\n\n${result.fullPlan}`;
    }
    if (typeof result.summary === "string") {
      return `${title}\n\n${result.summary}`;
    }
  }

  return `${title}\n\n${JSON.stringify(payload, null, 2)}`;
}
