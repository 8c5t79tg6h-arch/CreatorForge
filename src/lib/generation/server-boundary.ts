/**
 * Server-only boundary helpers. Keep OpenAI and provider registration
 * out of client bundles by importing this module only from route handlers
 * or Node scripts.
 */
export { registerServerProviders } from "./server-register";
export { runGeneration, runGenerationFromUnknown } from "./service";
export { getAIProvider, resolveProviderName } from "./config";
export { GenerationServiceError } from "./types";
