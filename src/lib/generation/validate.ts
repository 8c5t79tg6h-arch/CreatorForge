import type {
  CodingPromptInput,
  ContentIdeaInput,
  GenerationRequest,
  RobloxGameInput,
} from "./types";
import { GenerationServiceError } from "./types";

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
    platform: requireString(input.platform, "platform") as ContentIdeaInput["platform"],
    contentType: requireString(
      input.contentType,
      "contentType",
    ) as ContentIdeaInput["contentType"],
    tone: requireString(input.tone, "tone") as ContentIdeaInput["tone"],
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
    target: requireString(input.target, "target") as CodingPromptInput["target"],
    technology: requireString(input.technology, "technology"),
    experienceLevel: requireString(
      input.experienceLevel,
      "experienceLevel",
    ) as CodingPromptInput["experienceLevel"],
    promptStyle: requireString(
      input.promptStyle,
      "promptStyle",
    ) as CodingPromptInput["promptStyle"],
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
    genre: requireString(input.genre, "genre") as RobloxGameInput["genre"],
    coreGameplay: requireString(input.coreGameplay, "coreGameplay"),
    audience: requireString(
      input.audience,
      "audience",
    ) as RobloxGameInput["audience"],
    artStyle: requireString(
      input.artStyle,
      "artStyle",
    ) as RobloxGameInput["artStyle"],
    monetization: requireString(
      input.monetization,
      "monetization",
    ) as RobloxGameInput["monetization"],
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
  throw new GenerationServiceError(
    "unsupported",
    `Unsupported generation kind: ${String(body.kind)}`,
  );
}
