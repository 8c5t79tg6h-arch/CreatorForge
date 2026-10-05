import type {
  CodingPromptInput,
  ContentIdeaInput,
  ContentIdeaResult,
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

export const openaiProvider: AIProvider = {
  name: "openai",
  async generateContentIdeas(input: ContentIdeaInput) {
    return structuredGenerate<ContentIdeaResult>({
      system:
        "You generate practical social content ideas for creators. Return JSON only matching the schema. Match the requested platform, content type, and tone. Produce exactly the requested count of ideas when possible.",
      user: JSON.stringify(input),
      schemaName: "content_idea_result",
      schema: contentIdeaSchema,
    });
  },
  async generateCodingPrompt(input: CodingPromptInput) {
    const data = await structuredGenerate<{
      sections: import("@/lib/domain/types").CodingPromptSections;
    }>({
      system:
        "You write structured coding prompts for engineers. Return JSON only matching the schema. Be concrete and actionable.",
      user: JSON.stringify(input),
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
        "You design practical Roblox game plans. Return JSON only matching the schema. Keep MVP scope realistic.",
      user: JSON.stringify(input),
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
      user: JSON.stringify(input),
      schemaName: "thirty_day_planner_result",
      schema: thirtyDayPlannerSchema,
    });
  },
};
