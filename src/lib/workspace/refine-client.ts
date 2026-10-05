import { GenerationServiceError } from "@/lib/generation/types";
import type { RefineRequest, RefineResult } from "@/lib/generation/refine";

export async function refineViaApi(
  request: RefineRequest,
): Promise<RefineResult> {
  const response = await fetch("/api/refine", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  const data = (await response.json().catch(() => null)) as
    | RefineResult
    | { error?: string; code?: string }
    | null;

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data && data.error
        ? String(data.error)
        : `Refine failed (${response.status})`;
    const code =
      data && typeof data === "object" && "code" in data && data.code
        ? (String(data.code) as GenerationServiceError["code"])
        : "provider_error";
    throw new GenerationServiceError(code, message);
  }

  if (
    !data ||
    typeof data !== "object" ||
    !("payload" in data) ||
    typeof (data as RefineResult).payload !== "object"
  ) {
    throw new GenerationServiceError(
      "provider_error",
      "Refine returned an unexpected payload",
    );
  }

  return data as RefineResult;
}
