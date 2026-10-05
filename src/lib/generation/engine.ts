/**
 * CreatorForge AI generation engine (public server-side entrypoints).
 *
 * Pipeline:
 *   User Input → validateGenerationRequest
 *             → AI Provider (mock | openai | future)
 *             → Structured Result
 *             → normalizeGenerationResult
 *             → UI → Save to Projects
 *
 * Tools should keep calling generateViaApi / runGenerationFromUnknown.
 * Do not import openai-provider from client code.
 */

export { runGeneration, runGenerationFromUnknown } from "./service";
export { validateGenerationRequest } from "./validate";
export { normalizeGenerationResult } from "./normalize";
export {
  registerProvider,
  getAIProvider,
  resolveProviderName,
  getOpenAIConfig,
} from "./config";
export type { AIProvider, AIProviderName } from "./types";
export { GenerationServiceError } from "./types";
