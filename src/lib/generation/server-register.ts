import { registerProvider } from "./config";
import { mockProvider } from "./mock-provider";
import { openaiProvider } from "./openai-provider";

let registered = false;

export function registerServerProviders(): void {
  if (registered) return;
  registerProvider(mockProvider);
  registerProvider(openaiProvider);
  registered = true;
}
