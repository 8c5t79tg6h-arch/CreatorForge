import { getAIProvider } from "./config";
import type {
  AIProvider,
  AIProviderName,
  GenerationRequest,
  GenerationResult,
} from "./types";
import { GenerationServiceError } from "./types";
import { validateGenerationRequest } from "./validate";

export async function runGeneration(
  request: GenerationRequest,
  providerName?: AIProviderName,
): Promise<GenerationResult> {
  const provider: AIProvider = getAIProvider(providerName);

  switch (request.kind) {
    case "content-idea": {
      const result = await provider.generateContentIdeas(request.input);
      return { kind: "content-idea", result };
    }
    case "coding-prompt": {
      const result = await provider.generateCodingPrompt(request.input);
      return { kind: "coding-prompt", result };
    }
    case "roblox-game": {
      const result = await provider.generateRobloxGame(request.input);
      return { kind: "roblox-game", result };
    }
    case "thirty-day-planner": {
      const result = await provider.generateThirtyDayPlan(request.input);
      return { kind: "thirty-day-planner", result };
    }
    default: {
      const _exhaustive: never = request;
      throw new GenerationServiceError(
        "unsupported",
        `Unsupported request: ${JSON.stringify(_exhaustive)}`,
      );
    }
  }
}

export async function runGenerationFromUnknown(
  raw: unknown,
  providerName?: AIProviderName,
): Promise<GenerationResult> {
  const request = validateGenerationRequest(raw);
  return runGeneration(request, providerName);
}
