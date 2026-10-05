import { getAIProvider, getOpenAIConfig, resolveProviderName } from "./config";
import { normalizeGenerationResult } from "./normalize";
import type {
  AIProvider,
  AIProviderName,
  GenerationRequest,
  GenerationResult,
} from "./types";
import { GenerationServiceError } from "./types";
import { validateGenerationRequest } from "./validate";

async function invokeProvider(
  provider: AIProvider,
  request: GenerationRequest,
): Promise<unknown> {
  switch (request.kind) {
    case "content-idea":
      return provider.generateContentIdeas(request.input);
    case "coding-prompt":
      return provider.generateCodingPrompt(request.input);
    case "roblox-game":
      return provider.generateRobloxGame(request.input);
    case "thirty-day-planner":
      return provider.generateThirtyDayPlan(request.input);
    default: {
      const _exhaustive: never = request;
      throw new GenerationServiceError(
        "unsupported",
        `Unsupported request: ${JSON.stringify(_exhaustive)}`,
      );
    }
  }
}

/**
 * Core AI generation engine:
 * validated input → provider → structured result → normalize/validate → UI/save
 */
export async function runGeneration(
  request: GenerationRequest,
  providerName?: AIProviderName,
): Promise<GenerationResult> {
  const resolved = providerName ?? resolveProviderName();
  const provider = getAIProvider(resolved);

  if (resolved === "openai" && !getOpenAIConfig().apiKey) {
    throw new GenerationServiceError(
      "provider_error",
      "OPENAI_API_KEY is not configured",
    );
  }

  const rawResult = await invokeProvider(provider, request);
  return normalizeGenerationResult(request, rawResult);
}

export async function runGenerationFromUnknown(
  raw: unknown,
  providerName?: AIProviderName,
): Promise<GenerationResult> {
  const request = validateGenerationRequest(raw);
  return runGeneration(request, providerName);
}
