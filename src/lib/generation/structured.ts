import { getOpenAIConfig } from "./config";
import type { JsonSchema } from "./schemas";
import { GenerationServiceError } from "./types";

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

/**
 * Shared structured-output call for OpenAI chat completions.
 * Providers pass schema + prompts; the engine normalizes results afterward.
 */
export async function structuredGenerate<T>(options: {
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

    try {
      return JSON.parse(content) as T;
    } catch {
      throw new GenerationServiceError(
        "provider_error",
        "OpenAI returned invalid JSON",
      );
    }
  } catch (error) {
    if (error instanceof GenerationServiceError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new GenerationServiceError("timeout", "OpenAI request timed out");
    }
    throw new GenerationServiceError(
      "provider_error",
      "OpenAI request failed",
    );
  } finally {
    clearTimeout(timer);
  }
}
