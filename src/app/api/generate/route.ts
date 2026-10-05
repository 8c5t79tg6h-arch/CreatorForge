import { NextResponse } from "next/server";
import {
  GenerationServiceError,
  registerServerProviders,
  runGenerationFromUnknown,
} from "@/lib/generation/server-boundary";

export const runtime = "nodejs";

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
        { error: error.message, code: error.code },
        { status },
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected error",
        code: "provider_error",
      },
      { status: 500 },
    );
  }
}
