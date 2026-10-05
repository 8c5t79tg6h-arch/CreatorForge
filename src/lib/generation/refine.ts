import { composeFullPrompt } from "@/lib/domain/codingPromptGenerator";
import { composeFullPlan } from "@/lib/domain/robloxGameGenerator";
import type {
  CodingPromptInput,
  CodingPromptResult,
  ContentIdea,
  ContentIdeaInput,
  ContentIdeaResult,
  RobloxGameInput,
  RobloxGameResult,
  ThirtyDayPlannerInput,
  ThirtyDayPlannerResult,
} from "@/lib/domain/types";
import type { PersistedContent, PersistedContentKind } from "@/lib/persistence";
import { getAIProvider, getOpenAIConfig, resolveProviderName } from "./config";
import { GenerationServiceError } from "./types";
import {
  codingPromptSchema,
  contentIdeaSchema,
  robloxGameSchema,
  thirtyDayPlannerSchema,
} from "./schemas";
import { structuredGenerate } from "./structured";
import { normalizeGenerationResult } from "./normalize";

import { REFINE_PRESETS } from "@/lib/workspace/refine-presets";

export type RefineRequest = {
  targetKind: PersistedContentKind;
  instruction: string;
  title: string;
  payload: PersistedContent["payload"];
};

export type RefineResult = {
  title: string;
  payload: PersistedContent["payload"];
};

export { REFINE_PRESETS };

function requireInstruction(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new GenerationServiceError(
      "invalid_request",
      "instruction is required",
    );
  }
  return value.trim().slice(0, 2000);
}

export function validateRefineRequest(raw: unknown): RefineRequest {
  if (!raw || typeof raw !== "object") {
    throw new GenerationServiceError("invalid_request", "body is required");
  }
  const body = raw as Record<string, unknown>;
  const targetKind = body.targetKind;
  if (
    targetKind !== "content-idea" &&
    targetKind !== "coding-prompt" &&
    targetKind !== "roblox-game" &&
    targetKind !== "thirty-day-planner"
  ) {
    throw new GenerationServiceError(
      "invalid_request",
      "targetKind is invalid",
    );
  }
  if (typeof body.payload !== "object" || body.payload === null) {
    throw new GenerationServiceError("invalid_request", "payload is required");
  }
  return {
    targetKind,
    instruction: requireInstruction(body.instruction),
    title:
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim()
        : "Untitled",
    payload: body.payload as PersistedContent["payload"],
  };
}

function applyTextRefine(text: string, instruction: string): string {
  const lower = instruction.toLowerCase();
  if (lower.includes("shorter")) {
    return text.length > 120 ? `${text.slice(0, 110).trim()}…` : text;
  }
  if (lower.includes("expand") || lower.includes("engaging")) {
    return `${text} — sharpened for clarity, energy, and a stronger next step.`;
  }
  if (lower.includes("professional")) {
    return text.replace(/\b(gonna|wanna|kinda)\b/gi, "will").replace(/!+/g, ".");
  }
  if (lower.includes("viral") || lower.includes("hook")) {
    return `Stop scrolling: ${text}`;
  }
  if (lower.includes("rewrite") || lower.includes("tone")) {
    return `${text} (refined tone)`;
  }
  return `${text} [${instruction}]`;
}

function mockRefine(request: RefineRequest): RefineResult {
  const instruction = request.instruction;

  if (request.targetKind === "content-idea") {
    const payload = request.payload as {
      input?: ContentIdeaInput;
      ideas?: ContentIdea[];
    };
    const ideas = Array.isArray(payload.ideas) ? payload.ideas : [];
    const nextIdeas = ideas.map((idea) => ({
      ...idea,
      title: applyTextRefine(String(idea.title ?? ""), instruction),
      description: applyTextRefine(String(idea.description ?? ""), instruction),
      hook: applyTextRefine(
        String((idea as ContentIdea & { hook?: string }).hook ?? idea.title ?? ""),
        instruction,
      ),
    }));
    return {
      title: applyTextRefine(request.title, instruction),
      payload: { input: payload.input ?? {}, ideas: nextIdeas },
    };
  }

  if (request.targetKind === "coding-prompt") {
    const payload = request.payload as {
      input?: CodingPromptInput;
      result?: CodingPromptResult;
    };
    const result = payload.result;
    if (!result?.sections) {
      throw new GenerationServiceError(
        "invalid_request",
        "coding-prompt payload missing result",
      );
    }
    const sections = {
      ...result.sections,
      overview: applyTextRefine(result.sections.overview, instruction),
      architecture: applyTextRefine(result.sections.architecture, instruction),
      requirements: result.sections.requirements.map((item) =>
        applyTextRefine(item, instruction),
      ),
    };
    const input = payload.input as CodingPromptInput;
    return {
      title: applyTextRefine(request.title, instruction),
      payload: {
        input,
        result: {
          sections,
          fullPrompt: composeFullPrompt(input, sections),
        },
      },
    };
  }

  if (request.targetKind === "roblox-game") {
    const payload = request.payload as {
      input?: RobloxGameInput;
      result?: RobloxGameResult;
    };
    const result = payload.result;
    if (!result?.sections) {
      throw new GenerationServiceError(
        "invalid_request",
        "roblox-game payload missing result",
      );
    }
    const sections = {
      ...result.sections,
      concept: applyTextRefine(result.sections.concept, instruction),
      coreLoop: applyTextRefine(result.sections.coreLoop, instruction),
      progression: applyTextRefine(result.sections.progression, instruction),
      monetizationPlan: applyTextRefine(
        result.sections.monetizationPlan,
        instruction,
      ),
      mapAndWorld: applyTextRefine(result.sections.mapAndWorld, instruction),
      systems: result.sections.systems.map((item) =>
        applyTextRefine(item, instruction),
      ),
      mvpScope: result.sections.mvpScope.map((item) =>
        applyTextRefine(item, instruction),
      ),
      stretchGoals: result.sections.stretchGoals.map((item) =>
        applyTextRefine(item, instruction),
      ),
    };
    const input = payload.input as RobloxGameInput;
    return {
      title: applyTextRefine(request.title, instruction),
      payload: {
        input,
        result: {
          sections,
          fullPlan: composeFullPlan(input, sections),
        },
      },
    };
  }

  const payload = request.payload as {
    input?: ThirtyDayPlannerInput;
    result?: ThirtyDayPlannerResult;
  };
  const result = payload.result;
  if (!result?.posts) {
    throw new GenerationServiceError(
      "invalid_request",
      "thirty-day-planner payload missing result",
    );
  }
  return {
    title: applyTextRefine(request.title, instruction),
    payload: {
      input: payload.input ?? {},
      result: {
        summary: applyTextRefine(result.summary, instruction),
        posts: result.posts.map((post) => ({
          ...post,
          title: applyTextRefine(post.title, instruction),
          hook: applyTextRefine(post.hook, instruction),
          cta: applyTextRefine(post.cta, instruction),
          notes: applyTextRefine(post.notes, instruction),
        })),
      },
    },
  };
}

async function openaiRefine(request: RefineRequest): Promise<RefineResult> {
  const system = `You refine CreatorForge ${request.targetKind} content. Apply the user's instruction. Return JSON only matching the schema. Preserve structure and required fields. Do not drop items unless shortening is explicitly requested.`;
  const user = JSON.stringify({
    instruction: request.instruction,
    title: request.title,
    payload: request.payload,
  });

  if (request.targetKind === "content-idea") {
    const data = await structuredGenerate<ContentIdeaResult>({
      system,
      user,
      schemaName: "content_idea_result",
      schema: contentIdeaSchema,
    });
    const input = (request.payload as { input?: ContentIdeaInput }).input;
    const normalized = normalizeGenerationResult(
      {
        kind: "content-idea",
        input: {
          topic: input?.topic || request.title,
          platform: input?.platform || "TikTok",
          contentType: input?.contentType || "Short-form video",
          tone: input?.tone || "Educational",
          count: Math.max(1, data.ideas?.length || 1),
        },
      },
      data,
    );
    if (normalized.kind !== "content-idea") {
      throw new GenerationServiceError("provider_error", "Refine kind mismatch");
    }
    return {
      title: request.title,
      payload: { input, ideas: normalized.result.ideas },
    };
  }

  if (request.targetKind === "coding-prompt") {
    const data = await structuredGenerate<{
      sections: CodingPromptResult["sections"];
    }>({
      system,
      user,
      schemaName: "coding_prompt_result",
      schema: codingPromptSchema,
    });
    const input = (request.payload as { input?: CodingPromptInput }).input!;
    const normalized = normalizeGenerationResult(
      {
        kind: "coding-prompt",
        input,
      },
      data,
    );
    if (normalized.kind !== "coding-prompt") {
      throw new GenerationServiceError("provider_error", "Refine kind mismatch");
    }
    return {
      title: request.title,
      payload: { input, result: normalized.result },
    };
  }

  if (request.targetKind === "roblox-game") {
    const data = await structuredGenerate<{
      sections: RobloxGameResult["sections"];
    }>({
      system,
      user,
      schemaName: "roblox_game_result",
      schema: robloxGameSchema,
    });
    const input = (request.payload as { input?: RobloxGameInput }).input!;
    const normalized = normalizeGenerationResult(
      { kind: "roblox-game", input },
      data,
    );
    if (normalized.kind !== "roblox-game") {
      throw new GenerationServiceError("provider_error", "Refine kind mismatch");
    }
    return {
      title: request.title,
      payload: { input, result: normalized.result },
    };
  }

  const data = await structuredGenerate<ThirtyDayPlannerResult>({
    system,
    user,
    schemaName: "thirty_day_planner_result",
    schema: thirtyDayPlannerSchema,
  });
  const input = (request.payload as { input?: ThirtyDayPlannerInput }).input!;
  const normalized = normalizeGenerationResult(
    { kind: "thirty-day-planner", input },
    data,
  );
  if (normalized.kind !== "thirty-day-planner") {
    throw new GenerationServiceError("provider_error", "Refine kind mismatch");
  }
  return {
    title: request.title,
    payload: { input, result: normalized.result },
  };
}

export async function runRefine(raw: unknown): Promise<RefineResult> {
  const request = validateRefineRequest(raw);
  const providerName = resolveProviderName();
  // Ensure providers are registered by callers; mock path does not need OpenAI.
  getAIProvider(providerName === "openai" ? "openai" : "mock");

  if (providerName === "openai") {
    if (!getOpenAIConfig().apiKey) {
      throw new GenerationServiceError(
        "provider_error",
        "OPENAI_API_KEY is not configured",
      );
    }
    return openaiRefine(request);
  }

  return mockRefine(request);
}
