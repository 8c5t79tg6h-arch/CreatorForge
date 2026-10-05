import { NextResponse } from "next/server";
import {
  GenerationServiceError,
  registerServerProviders,
  runGenerationFromUnknown,
} from "@/lib/generation/server-boundary";

export const runtime = "nodejs";

function publicErrorMessage(error: GenerationServiceError): string {
  switch (error.code) {
    case "invalid_request":
    case "unsupported":
      return error.message;
    case "timeout":
      return "Generation timed out. Try again.";
    case "provider_error":
      if (error.message.includes("OPENAI_API_KEY")) {
        return "OpenAI is selected but OPENAI_API_KEY is not configured.";
      }
      return "Generation failed. Try again or switch AI_PROVIDER to mock.";
    default:
      return "Generation failed.";
  }
}

export async function POST(request: Request) {
  registerServerProviders();

  try {
    const body = await request.json();
    const result = await runGenerationFromUnknown(body);
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
        error: "Generation failed.",
        code: "provider_error",
      },
      { status: 500 },
    );
  }
}
