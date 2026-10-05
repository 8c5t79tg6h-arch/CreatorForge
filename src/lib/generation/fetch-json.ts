import { GenerationServiceError } from "@/lib/generation/types";

const DEFAULT_TIMEOUT_MS = 35_000;

export async function fetchJsonWithTimeout(
  url: string,
  init: RequestInit,
  options?: {
    timeoutMs?: number;
    timeoutMessage?: string;
  },
): Promise<{ response: Response; data: unknown }> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    const data = await response.json().catch(() => null);
    return { response, data };
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === "AbortError" || error.name === "TimeoutError")
    ) {
      throw new GenerationServiceError(
        "timeout",
        options?.timeoutMessage ?? "Request timed out. Try again.",
      );
    }
    throw new GenerationServiceError(
      "provider_error",
      error instanceof Error ? error.message : "Network request failed",
    );
  } finally {
    clearTimeout(timer);
  }
}
