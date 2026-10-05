import { NextResponse } from "next/server";
import { GenerationServiceError } from "@/lib/generation/types";
import { registerServerProviders } from "@/lib/generation/server-register";
import { runRefine } from "@/lib/generation/refine";

export const runtime = "nodejs";

function publicErrorMessage(error: GenerationServiceError): string {
  switch (error.code) {
    case "invalid_request":
    case "unsupported":
      return error.message;
    case "timeout":
      return "Refinement timed out. Try again.";
    case "provider_error":
      if (error.message.includes("OPENAI_API_KEY")) {
        return "OpenAI is selected but OPENAI_API_KEY is not configured.";
      }
      return "Refinement failed. Your project was not changed.";
    default:
      return "Refinement failed. Your project was not changed.";
  }
}

export async function POST(request: Request) {
  registerServerProviders();

  try {
    const body = await request.json();
    const result = await runRefine(body);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof GenerationServiceError) {
      const status =
        error.code === "invalid_request" || error.code === "unsupported"
          ? 400
          : error.code === "timeout"
            ? 504
            : 500;
      return NextResponse.json(
        { error: publicErrorMessage(error), code: error.code },
        { status },
      );
    }

    return NextResponse.json(
      {
        error: "Refinement failed. Your project was not changed.",
        code: "provider_error",
      },
      { status: 500 },
    );
  }
}
