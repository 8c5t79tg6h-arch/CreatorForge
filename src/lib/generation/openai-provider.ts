import type {
  CodingPromptInput,
  ContentIdeaInput,
  ContentIdeaResult,
  GenerationProjectContext,
  GenerationRequest,
  RobloxGameInput,
  ThirtyDayPlannerInput,
  ThirtyDayPlannerResult,
} from "@/lib/domain/types";
import { composeFullPrompt } from "@/lib/domain/codingPromptGenerator";
import { composeFullPlan } from "@/lib/domain/robloxGameGenerator";
import type { AIProvider } from "./types";
import {
  codingPromptSchema,
  contentIdeaSchema,
  robloxGameSchema,
  thirtyDayPlannerSchema,
} from "./schemas";
import { structuredGenerate } from "./structured";

function userPayload(
  input: unknown,
  projectContext?: GenerationProjectContext,
): string {
  return JSON.stringify({
    input,
    projectContext: projectContext ?? null,
    guidance:
      "Use projectContext only as soft creative context for this request. Do not invent unrelated brands or leak other projects.",
  });
}

export function createOpenAIProvider(
  getContext?: () => GenerationProjectContext | undefined,
): AIProvider {
  return {
    name: "openai",
    async generateContentIdeas(input: ContentIdeaInput) {
      return structuredGenerate<ContentIdeaResult>({
        system:
          "You generate practical social content ideas for creators. Return JSON only matching the schema. Match platform, content type, tone, audience, and goal when provided. Each idea needs a strong hook, clear CTA, and optional improvement notes. Produce exactly the requested count when possible.",
        user: userPayload(input, getContext?.()),
        schemaName: "content_idea_result",
        schema: contentIdeaSchema,
      });
    },
    async generateCodingPrompt(input: CodingPromptInput) {
      const data = await structuredGenerate<{
        sections: import("@/lib/domain/types").CodingPromptSections;
      }>({
        system:
          "You write structured coding prompts for engineers. Return JSON only matching the schema. Be concrete and actionable. Honor experience level, prompt style, and additional requirements.",
        user: userPayload(input, getContext?.()),
        schemaName: "coding_prompt_result",
        schema: codingPromptSchema,
      });
      return {
        sections: data.sections,
        fullPrompt: composeFullPrompt(input, data.sections),
      };
    },
    async generateRobloxGame(input: RobloxGameInput) {
      const data = await structuredGenerate<{
        sections: import("@/lib/domain/types").RobloxGameSections;
      }>({
        system:
          "You design practical Roblox game plans. Return JSON only matching the schema. Keep MVP scope realistic for the stated audience, genre, and monetization.",
        user: userPayload(input, getContext?.()),
        schemaName: "roblox_game_result",
        schema: robloxGameSchema,
      });
      return {
        sections: data.sections,
        fullPlan: composeFullPlan(input, data.sections),
      };
    },
    async generateThirtyDayPlan(input: ThirtyDayPlannerInput) {
      return structuredGenerate<ThirtyDayPlannerResult>({
        system:
          "You create a practical 30-day content calendar for creators. Return exactly 30 posts (days 1-30) as JSON matching the schema. Rotate platforms from the input list, keep hooks short, and match the requested tone and goal.",
        user: userPayload(input, getContext?.()),
        schemaName: "thirty_day_planner_result",
        schema: thirtyDayPlannerSchema,
      });
    },
  };
}

/** Default provider used by the registry (no ambient project context). */
export const openaiProvider: AIProvider = createOpenAIProvider();

/** Build a provider bound to one request's project context. */
export function openaiProviderForRequest(
  request: GenerationRequest,
): AIProvider {
  return createOpenAIProvider(() => request.projectContext);
}
