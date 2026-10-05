import { composeFullPrompt } from "@/lib/domain/codingPromptGenerator";
import { composeFullPlan } from "@/lib/domain/robloxGameGenerator";
import type {
  CodingPromptResult,
  CodingPromptSections,
  ContentIdea,
  ContentIdeaResult,
  GenerationRequest,
  GenerationResult,
  PlannedPost,
  RobloxGameResult,
  RobloxGameSections,
  ThirtyDayPlannerResult,
} from "@/lib/domain/types";
import {
  CONTENT_PLATFORMS,
  CONTENT_TYPES,
  coerceEnum,
} from "./catalog";
import { GenerationServiceError } from "./types";

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object") {
    throw new GenerationServiceError(
      "provider_error",
      `Provider returned invalid ${label}`,
    );
  }
  return value as Record<string, unknown>;
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new GenerationServiceError(
      "provider_error",
      `Provider result missing ${field}`,
    );
  }
  return value.trim();
}

function requireStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) {
    throw new GenerationServiceError(
      "provider_error",
      `Provider result missing ${field}`,
    );
  }
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeContentIdeaResult(
  request: Extract<GenerationRequest, { kind: "content-idea" }>,
  raw: unknown,
): ContentIdeaResult {
  const body = asRecord(raw, "content-idea result");
  const ideasRaw = Array.isArray(body.ideas) ? body.ideas : null;
  if (!ideasRaw || ideasRaw.length === 0) {
    throw new GenerationServiceError(
      "provider_error",
      "Provider returned no content ideas",
    );
  }

  const count = request.input.count;
  const ideas: ContentIdea[] = ideasRaw.slice(0, count).map((item, index) => {
    const idea = asRecord(item, `idea[${index}]`);
    const title = requireNonEmptyString(idea.title, "idea.title");
    return {
      id: requireNonEmptyString(idea.id ?? `idea-${index + 1}`, "idea.id"),
      title,
      description: requireNonEmptyString(idea.description, "idea.description"),
      format: requireNonEmptyString(
        idea.format ?? request.input.contentType,
        "idea.format",
      ),
      platform: coerceEnum(
        idea.platform ?? request.input.platform,
        CONTENT_PLATFORMS,
        request.input.platform,
      ),
      keywords: requireStringArray(idea.keywords ?? [], "idea.keywords"),
      hook:
        typeof idea.hook === "string" && idea.hook.trim()
          ? idea.hook.trim()
          : title,
      audience:
        typeof idea.audience === "string" && idea.audience.trim()
          ? idea.audience.trim()
          : request.input.audience?.trim() || undefined,
      cta:
        typeof idea.cta === "string" && idea.cta.trim()
          ? idea.cta.trim()
          : undefined,
      improvementNotes:
        typeof idea.improvementNotes === "string" && idea.improvementNotes.trim()
          ? idea.improvementNotes.trim()
          : undefined,
    };
  });

  if (ideas.length === 0) {
    throw new GenerationServiceError(
      "provider_error",
      "Provider returned empty content ideas after normalization",
    );
  }

  return { ideas };
}

function normalizeCodingSections(raw: unknown): CodingPromptSections {
  const sections = asRecord(
    asRecord(raw, "coding-prompt result").sections,
    "coding-prompt sections",
  );
  return {
    overview: requireNonEmptyString(sections.overview, "sections.overview"),
    requirements: requireStringArray(
      sections.requirements,
      "sections.requirements",
    ),
    architecture: requireNonEmptyString(
      sections.architecture,
      "sections.architecture",
    ),
    implementationSteps: requireStringArray(
      sections.implementationSteps,
      "sections.implementationSteps",
    ),
    acceptanceCriteria: requireStringArray(
      sections.acceptanceCriteria,
      "sections.acceptanceCriteria",
    ),
    constraints: requireStringArray(
      sections.constraints,
      "sections.constraints",
    ),
  };
}

function normalizeCodingPromptResult(
  request: Extract<GenerationRequest, { kind: "coding-prompt" }>,
  raw: unknown,
): CodingPromptResult {
  const body = asRecord(raw, "coding-prompt result");
  const sections = normalizeCodingSections(body);
  const fullPrompt =
    typeof body.fullPrompt === "string" && body.fullPrompt.trim()
      ? body.fullPrompt.trim()
      : composeFullPrompt(request.input, sections);
  return { sections, fullPrompt };
}

function normalizeRobloxSections(raw: unknown): RobloxGameSections {
  const sections = asRecord(
    asRecord(raw, "roblox-game result").sections,
    "roblox-game sections",
  );
  return {
    concept: requireNonEmptyString(sections.concept, "sections.concept"),
    coreLoop: requireNonEmptyString(sections.coreLoop, "sections.coreLoop"),
    systems: requireStringArray(sections.systems, "sections.systems"),
    progression: requireNonEmptyString(
      sections.progression,
      "sections.progression",
    ),
    monetizationPlan: requireNonEmptyString(
      sections.monetizationPlan,
      "sections.monetizationPlan",
    ),
    mapAndWorld: requireNonEmptyString(
      sections.mapAndWorld,
      "sections.mapAndWorld",
    ),
    mvpScope: requireStringArray(sections.mvpScope, "sections.mvpScope"),
    stretchGoals: requireStringArray(
      sections.stretchGoals,
      "sections.stretchGoals",
    ),
  };
}

function normalizeRobloxGameResult(
  request: Extract<GenerationRequest, { kind: "roblox-game" }>,
  raw: unknown,
): RobloxGameResult {
  const body = asRecord(raw, "roblox-game result");
  const sections = normalizeRobloxSections(body);
  const fullPlan =
    typeof body.fullPlan === "string" && body.fullPlan.trim()
      ? body.fullPlan.trim()
      : composeFullPlan(request.input, sections);
  return { sections, fullPlan };
}

function normalizeThirtyDayPlannerResult(
  request: Extract<GenerationRequest, { kind: "thirty-day-planner" }>,
  raw: unknown,
): ThirtyDayPlannerResult {
  const body = asRecord(raw, "thirty-day-planner result");
  const postsRaw = Array.isArray(body.posts) ? body.posts : [];
  if (postsRaw.length === 0) {
    throw new GenerationServiceError(
      "provider_error",
      "Provider returned no planner posts",
    );
  }

  const fallbackPlatform = request.input.platforms[0] ?? "TikTok";
  const normalized: PlannedPost[] = postsRaw.slice(0, 30).map((item, index) => {
    const post = asRecord(item, `post[${index}]`);
    const day = Math.min(
      Math.max(
        typeof post.day === "number" ? Math.round(post.day) : index + 1,
        1,
      ),
      30,
    );
    return {
      id: requireNonEmptyString(post.id ?? `day-${day}`, "post.id"),
      day,
      platform: coerceEnum(post.platform, CONTENT_PLATFORMS, fallbackPlatform),
      contentType: coerceEnum(
        post.contentType,
        CONTENT_TYPES,
        "Short-form video",
      ),
      title: requireNonEmptyString(post.title, "post.title"),
      hook: requireNonEmptyString(post.hook, "post.hook"),
      cta: requireNonEmptyString(post.cta, "post.cta"),
      notes: requireNonEmptyString(post.notes ?? "—", "post.notes"),
    };
  });

  // Ensure days 1–30 exist; fill gaps by cloning nearest available post.
  const byDay = new Map<number, PlannedPost>();
  for (const post of normalized) {
    if (!byDay.has(post.day)) byDay.set(post.day, post);
  }
  const posts: PlannedPost[] = [];
  for (let day = 1; day <= 30; day += 1) {
    const existing = byDay.get(day);
    if (existing) {
      posts.push({ ...existing, day, id: existing.id || `day-${day}` });
      continue;
    }
    const donor =
      normalized[Math.min(normalized.length - 1, day - 1)] ?? normalized[0]!;
    posts.push({
      ...donor,
      id: `day-${day}`,
      day,
      title: `${donor.title} (day ${day})`,
      notes: `${donor.notes} · filled to complete 30-day calendar`,
    });
  }

  const summary =
    typeof body.summary === "string" && body.summary.trim()
      ? body.summary.trim()
      : `30-day ${request.input.tone.toLowerCase()} plan for “${request.input.niche}”.`;

  return { posts, summary };
}

/**
 * Validate + normalize provider output into the stable tool contracts.
 * Runs after every provider (mock or OpenAI) so UI/save always see reliable shapes.
 */
export function normalizeGenerationResult(
  request: GenerationRequest,
  rawResult: unknown,
): GenerationResult {
  switch (request.kind) {
    case "content-idea":
      return {
        kind: "content-idea",
        result: normalizeContentIdeaResult(request, rawResult),
      };
    case "coding-prompt":
      return {
        kind: "coding-prompt",
        result: normalizeCodingPromptResult(request, rawResult),
      };
    case "roblox-game":
      return {
        kind: "roblox-game",
        result: normalizeRobloxGameResult(request, rawResult),
      };
    case "thirty-day-planner":
      return {
        kind: "thirty-day-planner",
        result: normalizeThirtyDayPlannerResult(request, rawResult),
      };
    default: {
      const _exhaustive: never = request;
      throw new GenerationServiceError(
        "unsupported",
        `Unsupported request: ${JSON.stringify(_exhaustive)}`,
      );
    }
  }
}
