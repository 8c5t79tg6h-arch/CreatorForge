import { GenerationServiceError } from "@/lib/generation/types";
import type { RefineRequest, RefineResult } from "@/lib/generation/refine";
import { fetchJsonWithTimeout } from "@/lib/generation/fetch-json";
import { assertCanConsume, consumeUsage } from "@/lib/billing";

export async function refineViaApi(
  request: RefineRequest,
): Promise<RefineResult> {
  assertCanConsume("refine");

  const { response, data } = await fetchJsonWithTimeout(
    "/api/refine",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    },
    { timeoutMessage: "Refinement timed out. Your project was not changed." },
  );

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data && data.error
        ? String((data as { error?: string }).error)
        : `Refine failed (${response.status})`;
    const code =
      data && typeof data === "object" && "code" in data && data.code
        ? (String(
            (data as { code?: string }).code,
          ) as GenerationServiceError["code"])
        : "provider_error";
    throw new GenerationServiceError(code, message);
  }

  if (
    !data ||
    typeof data !== "object" ||
    !("payload" in data) ||
    typeof (data as RefineResult).payload !== "object" ||
    (data as RefineResult).payload === null
  ) {
    throw new GenerationServiceError(
      "provider_error",
      "Refine returned an unexpected payload",
    );
  }

  const result = data as RefineResult;
  if (!result.title?.trim()) {
    throw new GenerationServiceError(
      "provider_error",
      "Refine returned empty content. Your project was not changed.",
    );
  }

  consumeUsage("refine");
  return result;
}
