import { BillingLimitError } from "@/lib/billing";
import { GenerationServiceError } from "@/lib/generation";

export function formatAiError(error: unknown, fallback: string): string {
  if (error instanceof BillingLimitError) return error.message;
  if (error instanceof GenerationServiceError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}
