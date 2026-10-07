import type { GenerationRequest, GenerationResult } from "./types";
import { GenerationServiceError } from "./types";
import { fetchJsonWithTimeout } from "./fetch-json";
import { assertCanConsume, consumeUsage } from "@/lib/billing";

function isGenerationResult(value: unknown): value is GenerationResult {
  if (!value || typeof value !== "object") return false;
  const body = value as { kind?: unknown; result?: unknown };
  return (
    (body.kind === "content-idea" ||
      body.kind === "coding-prompt" ||
      body.kind === "roblox-game" ||
      body.kind === "thirty-day-planner") &&
    body.result !== null &&
    typeof body.result === "object"
  );
}

export async function generateViaApi(
  request: GenerationRequest,
): Promise<GenerationResult> {
  assertCanConsume("generate");

  const { response, data } = await fetchJsonWithTimeout(
    "/api/generate",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    },
    { timeoutMessage: "Generation timed out. Try again." },
  );

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data && data.error
        ? String((data as { error?: string }).error)
        : `Generation failed (${response.status})`;
    const code =
      data && typeof data === "object" && "code" in data && data.code
        ? (String((data as { code?: string }).code) as GenerationServiceError["code"])
        : "provider_error";
    throw new GenerationServiceError(code, message);
  }

  if (!isGenerationResult(data)) {
    throw new GenerationServiceError(
      "provider_error",
      "Generation returned an unexpected payload",
    );
  }

  consumeUsage("generate");
  return data;
}
