import type {
  CodingPromptInput,
  CodingPromptResult,
  ContentIdeaInput,
  ContentIdeaResult,
  GenerationKind,
  GenerationRequest,
  GenerationResult,
  RobloxGameInput,
  RobloxGameResult,
  ThirtyDayPlannerInput,
  ThirtyDayPlannerResult,
} from "@/lib/domain/types";

export type AIProviderName = "mock" | "openai";

export type AIProvider = {
  name: AIProviderName;
  generateContentIdeas(input: ContentIdeaInput): Promise<ContentIdeaResult>;
  generateCodingPrompt(input: CodingPromptInput): Promise<CodingPromptResult>;
  generateRobloxGame(input: RobloxGameInput): Promise<RobloxGameResult>;
  generateThirtyDayPlan(
    input: ThirtyDayPlannerInput,
  ): Promise<ThirtyDayPlannerResult>;
};

export type GenerationServiceErrorCode =
  | "invalid_request"
  | "provider_error"
  | "timeout"
  | "unsupported";

export class GenerationServiceError extends Error {
  code: GenerationServiceErrorCode;

  constructor(code: GenerationServiceErrorCode, message: string) {
    super(message);
    this.name = "GenerationServiceError";
    this.code = code;
  }
}

export type {
  CodingPromptInput,
  CodingPromptResult,
  ContentIdeaInput,
  ContentIdeaResult,
  GenerationKind,
  GenerationRequest,
  GenerationResult,
  RobloxGameInput,
  RobloxGameResult,
  ThirtyDayPlannerInput,
  ThirtyDayPlannerResult,
};
