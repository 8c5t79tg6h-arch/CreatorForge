import type { GenerationRequest, GenerationResult } from "./types";
import { GenerationServiceError } from "./types";

export async function generateViaApi(
  request: GenerationRequest,
): Promise<GenerationResult> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  const data = (await response.json().catch(() => null)) as
    | GenerationResult
    | { error?: string; code?: string }
    | null;

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data && data.error
        ? String(data.error)
        : `Generation failed (${response.status})`;
    const code =
      data && typeof data === "object" && "code" in data && data.code
        ? (String(data.code) as GenerationServiceError["code"])
        : "provider_error";
    throw new GenerationServiceError(code, message);
  }

  return data as GenerationResult;
}
