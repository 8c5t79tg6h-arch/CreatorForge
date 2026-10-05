import type {
  ContentIdea,
  ContentIdeaInput,
  ContentIdeaResult,
} from "@/lib/domain/types";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

const hooks = [
  "The overlooked angle on",
  "A practical teardown of",
  "What nobody tells you about",
  "A field guide to",
  "Stop guessing and master",
  "The creator's playbook for",
  "Build in public with",
  "From zero to proof for",
];

const formats = [
  "hook → proof → CTA",
  "myth vs reality",
  "checklist walkthrough",
  "before/after contrast",
  "story + lesson",
  "rapid-fire tips",
];

export function generateContentIdeas(
  input: ContentIdeaInput,
): ContentIdeaResult {
  const count = Math.min(Math.max(input.count || 5, 1), 12);
  const topicSlug = slugify(input.topic) || "idea";
  const ideas: ContentIdea[] = Array.from({ length: count }, (_, index) => {
    const hook = hooks[index % hooks.length];
    const format = formats[index % formats.length];
    const title = `${hook} ${input.topic}`;
    return {
      id: `${topicSlug}-${index + 1}`,
      title,
      description: `A ${input.tone.toLowerCase()} ${input.contentType.toLowerCase()} for ${input.platform} that uses a ${format} structure to make "${input.topic}" feel actionable and shareable.`,
      format: input.contentType,
      platform: input.platform,
      keywords: [
        input.topic,
        input.platform,
        input.tone,
        format.split(" ")[0] ?? "creator",
        "creatorforge",
      ].map((part) => part.toLowerCase()),
    };
  });

  return { ideas };
}

export function regenerateContentIdea(
  input: ContentIdeaInput,
  existing: ContentIdea,
  seed = Date.now(),
): ContentIdea {
  const hook = hooks[seed % hooks.length];
  const format = formats[(seed + 3) % formats.length];
  return {
    ...existing,
    id: `${existing.id}-r${seed % 10000}`,
    title: `${hook} ${input.topic}`,
    description: `Refined ${input.tone.toLowerCase()} take for ${input.platform}: frame "${input.topic}" with a ${format} arc and a clear next step for viewers.`,
    keywords: [
      input.topic,
      input.platform,
      "refined",
      format.split(" ")[0] ?? "idea",
    ].map((part) => part.toLowerCase()),
  };
}
