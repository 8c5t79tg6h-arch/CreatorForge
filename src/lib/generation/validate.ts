import type {
  CodingPromptInput,
  ContentIdeaInput,
  GenerationRequest,
  RobloxGameInput,
  ThirtyDayPlannerInput,
} from "./types";
import { GenerationServiceError } from "./types";
import {
  CODING_TARGETS,
  CONTENT_PLATFORMS,
  CONTENT_TONES,
  CONTENT_TYPES,
  EXPERIENCE_LEVELS,
  PLANNER_GOALS,
  PROMPT_STYLES,
  ROBLOX_ART_STYLES,
  ROBLOX_AUDIENCES,
  ROBLOX_GENRES,
  ROBLOX_MONETIZATION,
  requireEnum,
} from "./catalog";

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new GenerationServiceError(
      "invalid_request",
      `${field} is required`,
    );
  }
  return value.trim();
}

function requireNumber(value: unknown, field: string): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) {
    throw new GenerationServiceError(
      "invalid_request",
      `${field} must be a number`,
    );
  }
  return num;
}

export function validateContentIdeaInput(raw: unknown): ContentIdeaInput {
  if (!raw || typeof raw !== "object") {
    throw new GenerationServiceError("invalid_request", "input is required");
  }
  const input = raw as Record<string, unknown>;
  return {
    topic: requireString(input.topic, "topic"),
    platform: requireEnum(input.platform, "platform", CONTENT_PLATFORMS),
    contentType: requireEnum(input.contentType, "contentType", CONTENT_TYPES),
    tone: requireEnum(input.tone, "tone", CONTENT_TONES),
    count: Math.min(Math.max(requireNumber(input.count, "count"), 1), 12),
  };
}

export function validateCodingPromptInput(raw: unknown): CodingPromptInput {
  if (!raw || typeof raw !== "object") {
    throw new GenerationServiceError("invalid_request", "input is required");
  }
  const input = raw as Record<string, unknown>;
  return {
    idea: requireString(input.idea, "idea"),
    target: requireEnum(input.target, "target", CODING_TARGETS),
    technology: requireString(input.technology, "technology"),
    experienceLevel: requireEnum(
      input.experienceLevel,
      "experienceLevel",
      EXPERIENCE_LEVELS,
    ),
    promptStyle: requireEnum(input.promptStyle, "promptStyle", PROMPT_STYLES),
    additionalRequirements:
      typeof input.additionalRequirements === "string"
        ? input.additionalRequirements
        : undefined,
  };
}

export function validateRobloxGameInput(raw: unknown): RobloxGameInput {
  if (!raw || typeof raw !== "object") {
    throw new GenerationServiceError("invalid_request", "input is required");
  }
  const input = raw as Record<string, unknown>;
  return {
    idea: requireString(input.idea, "idea"),
    genre: requireEnum(input.genre, "genre", ROBLOX_GENRES),
    coreGameplay: requireString(input.coreGameplay, "coreGameplay"),
    audience: requireEnum(input.audience, "audience", ROBLOX_AUDIENCES),
    artStyle: requireEnum(input.artStyle, "artStyle", ROBLOX_ART_STYLES),
    monetization: requireEnum(
      input.monetization,
      "monetization",
      ROBLOX_MONETIZATION,
    ),
    desiredFeatures:
      typeof input.desiredFeatures === "string"
        ? input.desiredFeatures
        : undefined,
    additionalRequirements:
      typeof input.additionalRequirements === "string"
        ? input.additionalRequirements
        : undefined,
  };
}

export function validateThirtyDayPlannerInput(
  raw: unknown,
): ThirtyDayPlannerInput {
  if (!raw || typeof raw !== "object") {
    throw new GenerationServiceError("invalid_request", "input is required");
  }
  const input = raw as Record<string, unknown>;
  const platformsRaw = Array.isArray(input.platforms) ? input.platforms : [];
  const platforms = platformsRaw
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) =>
      (CONTENT_PLATFORMS as readonly string[]).includes(item),
    ) as ThirtyDayPlannerInput["platforms"];

  if (platforms.length === 0) {
    throw new GenerationServiceError(
      "invalid_request",
      "platforms must include at least one supported platform",
    );
  }

  return {
    niche: requireString(input.niche, "niche"),
    platforms,
    postsPerWeek: Math.min(
      Math.max(requireNumber(input.postsPerWeek, "postsPerWeek"), 1),
      14,
    ),
    tone: requireEnum(input.tone, "tone", CONTENT_TONES),
    goal: requireEnum(input.goal, "goal", PLANNER_GOALS),
    notes: typeof input.notes === "string" ? input.notes : undefined,
  };
}

export function validateGenerationRequest(raw: unknown): GenerationRequest {
  if (!raw || typeof raw !== "object") {
    throw new GenerationServiceError("invalid_request", "body is required");
  }
  const body = raw as { kind?: unknown; input?: unknown };
  if (body.kind === "content-idea") {
    return { kind: "content-idea", input: validateContentIdeaInput(body.input) };
  }
  if (body.kind === "coding-prompt") {
    return {
      kind: "coding-prompt",
      input: validateCodingPromptInput(body.input),
    };
  }
  if (body.kind === "roblox-game") {
    return { kind: "roblox-game", input: validateRobloxGameInput(body.input) };
  }
  if (body.kind === "thirty-day-planner") {
    return {
      kind: "thirty-day-planner",
      input: validateThirtyDayPlannerInput(body.input),
    };
  }
  throw new GenerationServiceError(
    "unsupported",
    `Unsupported generation kind: ${String(body.kind)}`,
  );
}
