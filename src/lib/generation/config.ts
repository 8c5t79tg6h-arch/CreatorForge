import type { AIProvider, AIProviderName } from "./types";

const providers = new Map<AIProviderName, AIProvider>();

export function registerProvider(provider: AIProvider): void {
  providers.set(provider.name, provider);
}

export function getRegisteredProvider(
  name: AIProviderName,
): AIProvider | undefined {
  return providers.get(name);
}

export function clearProvidersForTests(): void {
  providers.clear();
}

export function resolveProviderName(
  value = process.env.AI_PROVIDER,
): AIProviderName {
  if (value === "openai") return "openai";
  return "mock";
}

export function getOpenAIConfig() {
  return {
    apiKey: process.env.OPENAI_API_KEY ?? "",
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    timeoutMs: Number(process.env.OPENAI_TIMEOUT_MS || 30000),
  };
}

export function getAIProvider(name?: AIProviderName): AIProvider {
  const resolved = name ?? resolveProviderName();
  const provider = providers.get(resolved);
  if (!provider) {
    throw new Error(
      `AI provider "${resolved}" is not registered. Call registerServerProviders() on the server.`,
    );
  }
  return provider;
}
