import type {
  CodingPromptInput,
  ContentIdeaInput,
  ContentIdeaResult,
  RobloxGameInput,
} from "@/lib/domain/types";
import { composeFullPrompt } from "@/lib/domain/codingPromptGenerator";
import { composeFullPlan } from "@/lib/domain/robloxGameGenerator";
import { getOpenAIConfig } from "./config";
import type { AIProvider } from "./types";
import { GenerationServiceError } from "./types";

type JsonSchema = Record<string, unknown>;

const contentIdeaSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["ideas"],
  properties: {
    ideas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "title", "description", "format", "platform", "keywords"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          format: { type: "string" },
          platform: { type: "string" },
          keywords: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
};

const codingPromptSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["sections"],
  properties: {
    sections: {
      type: "object",
      additionalProperties: false,
      required: [
        "overview",
        "requirements",
        "architecture",
        "implementationSteps",
        "acceptanceCriteria",
        "constraints",
      ],
      properties: {
        overview: { type: "string" },
        requirements: { type: "array", items: { type: "string" } },
        architecture: { type: "string" },
        implementationSteps: { type: "array", items: { type: "string" } },
        acceptanceCriteria: { type: "array", items: { type: "string" } },
        constraints: { type: "array", items: { type: "string" } },
      },
    },
  },
};

const robloxGameSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["sections"],
  properties: {
    sections: {
      type: "object",
      additionalProperties: false,
      required: [
        "concept",
        "coreLoop",
        "systems",
        "progression",
        "monetizationPlan",
        "mapAndWorld",
        "mvpScope",
        "stretchGoals",
      ],
      properties: {
        concept: { type: "string" },
        coreLoop: { type: "string" },
        systems: { type: "array", items: { type: "string" } },
        progression: { type: "string" },
        monetizationPlan: { type: "string" },
        mapAndWorld: { type: "string" },
        mvpScope: { type: "array", items: { type: "string" } },
        stretchGoals: { type: "array", items: { type: "string" } },
      },
    },
  },
};

async function createOpenAIClient() {
  const { apiKey } = getOpenAIConfig();
  if (!apiKey) {
    throw new GenerationServiceError(
      "provider_error",
      "OPENAI_API_KEY is not configured",
    );
  }
  const { default: OpenAI } = await import("openai");
  return new OpenAI({ apiKey });
}

async function structuredGenerate<T>(options: {
  system: string;
  user: string;
  schemaName: string;
  schema: JsonSchema;
}): Promise<T> {
  const { model, timeoutMs } = getOpenAIConfig();
  const client = await createOpenAIClient();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await client.chat.completions.create(
      {
        model,
        messages: [
          { role: "system", content: options.system },
          { role: "user", content: options.user },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: options.schemaName,
            strict: true,
            schema: options.schema,
          },
        },
      },
      { signal: controller.signal },
    );

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new GenerationServiceError(
        "provider_error",
        "OpenAI returned an empty response",
      );
    }
    return JSON.parse(content) as T;
  } catch (error) {
    if (error instanceof GenerationServiceError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new GenerationServiceError("timeout", "OpenAI request timed out");
    }
    throw new GenerationServiceError(
      "provider_error",
      error instanceof Error ? error.message : "OpenAI request failed",
    );
  } finally {
    clearTimeout(timer);
  }
}

export const openaiProvider: AIProvider = {
  name: "openai",
  async generateContentIdeas(input: ContentIdeaInput) {
    const data = await structuredGenerate<ContentIdeaResult>({
      system:
        "You generate practical social content ideas. Return JSON only matching the schema.",
      user: JSON.stringify(input),
      schemaName: "content_idea_result",
      schema: contentIdeaSchema,
    });
    return data;
  },
  async generateCodingPrompt(input: CodingPromptInput) {
    const data = await structuredGenerate<{
      sections: CodingPromptInput extends never ? never : import("@/lib/domain/types").CodingPromptSections;
    }>({
      system:
        "You write structured coding prompts for engineers. Return JSON only matching the schema.",
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
        "You design practical Roblox game plans. Return JSON only matching the schema.",
      user: JSON.stringify(input),
      schemaName: "roblox_game_result",
      schema: robloxGameSchema,
    });
    return {
      sections: data.sections,
      fullPlan: composeFullPlan(input, data.sections),
    };
  },
};
