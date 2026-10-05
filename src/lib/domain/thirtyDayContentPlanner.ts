import type {
  ContentPlatform,
  ContentType,
  PlannedPost,
  ThirtyDayPlannerInput,
  ThirtyDayPlannerResult,
} from "@/lib/domain/types";

const weekThemes = [
  "Foundation & hooks",
  "Proof & stories",
  "Depth & tutorials",
  "Community & conversion",
] as const;

const titleSeeds = [
  "Start here with",
  "The real talk on",
  "A 60-second teardown of",
  "What changed my mind about",
  "Behind the scenes of",
  "Mistakes to skip with",
  "A checklist for",
  "How I actually ship",
  "Audience questions on",
  "The weekly reset for",
];

const hooks = [
  "If you only watch one thing this week…",
  "Stop doing this with your content.",
  "I tested this for 7 days so you don’t have to.",
  "Here’s the simple version nobody explains.",
  "Save this before you post again.",
  "The pattern that actually compounds.",
];

const ctas = [
  "Follow for the next day in the plan",
  "Comment your niche for a custom angle",
  "Save this and batch tomorrow’s draft",
  "Share with a creator friend",
  "Reply with Day X if you’re following along",
];

const typeByPlatform: Record<ContentPlatform, ContentType[]> = {
  YouTube: ["Short-form video", "Long-form video"],
  TikTok: ["Short-form video"],
  Instagram: ["Short-form video", "Carousel"],
  LinkedIn: ["Article", "Carousel", "Thread"],
  X: ["Thread", "Short-form video"],
  Blog: ["Article", "Newsletter"],
};

function pick<T>(items: T[], index: number): T {
  return items[index % items.length]!;
}

function rotatePlatforms(
  platforms: ContentPlatform[],
  dayIndex: number,
): ContentPlatform {
  const list = platforms.length > 0 ? platforms : (["TikTok"] as ContentPlatform[]);
  return list[dayIndex % list.length]!;
}

export function generateThirtyDayPlan(
  input: ThirtyDayPlannerInput,
): ThirtyDayPlannerResult {
  const platforms =
    input.platforms.length > 0 ? input.platforms : (["TikTok"] as ContentPlatform[]);
  const cadence = Math.min(Math.max(input.postsPerWeek || 5, 1), 14);
  // Always return 30 day slots; lighter cadence skips with lighter posts still present
  // so the calendar is complete. Intensity note goes in summary.
  const posts: PlannedPost[] = Array.from({ length: 30 }, (_, index) => {
    const day = index + 1;
    const week = Math.floor(index / 7);
    const theme = weekThemes[Math.min(week, weekThemes.length - 1)]!;
    const platform = rotatePlatforms(platforms, index);
    const contentType = pick(typeByPlatform[platform], index + week);
    const intensity =
      cadence >= 7 || index % Math.max(1, Math.round(7 / cadence)) === 0
        ? "core"
        : "light";

    const title = `${pick(titleSeeds, index)} ${input.niche}`;
    return {
      id: `day-${day}`,
      day,
      platform,
      contentType,
      title,
      hook: pick(hooks, index + week),
      cta: pick(ctas, index),
      notes: `${theme} · ${input.tone} tone · Goal: ${input.goal}${
        intensity === "light" ? " · lighter day for your cadence" : ""
      }${input.notes ? ` · ${input.notes}` : ""}`,
    };
  });

  return {
    posts,
    summary: `30-day ${input.tone.toLowerCase()} plan for “${input.niche}” across ${platforms.join(", ")} at ~${cadence}/week, aimed at ${input.goal.toLowerCase()}.`,
  };
}

export function regeneratePlannedPost(
  input: ThirtyDayPlannerInput,
  existing: PlannedPost,
  seed = Date.now(),
): PlannedPost {
  const platform = existing.platform;
  const contentType = pick(typeByPlatform[platform], seed);
  return {
    ...existing,
    id: `${existing.id}-r${seed % 10000}`,
    contentType,
    title: `${pick(titleSeeds, seed)} ${input.niche}`,
    hook: pick(hooks, seed + 2),
    cta: pick(ctas, seed + 1),
    notes: `Refined day ${existing.day} · ${input.tone} · ${input.goal}`,
  };
}

export function formatPlanAsText(result: ThirtyDayPlannerResult): string {
  const lines = [result.summary, ""];
  for (const post of result.posts) {
    lines.push(
      `Day ${post.day} · ${post.platform} · ${post.contentType}`,
      post.title,
      `Hook: ${post.hook}`,
      `CTA: ${post.cta}`,
      post.notes,
      "",
    );
  }
  return lines.join("\n").trim();
}
