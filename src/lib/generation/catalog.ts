import type {
  CodingTarget,
  ContentPlatform,
  ContentTone,
  ContentType,
  ExperienceLevel,
  PlannerGoal,
  PromptStyle,
  RobloxArtStyle,
  RobloxAudience,
  RobloxGenre,
  RobloxMonetization,
} from "@/lib/domain/types";
import { GenerationServiceError } from "./types";

export const CONTENT_PLATFORMS = [
  "YouTube",
  "TikTok",
  "Instagram",
  "LinkedIn",
  "X",
  "Blog",
] as const satisfies readonly ContentPlatform[];

export const CONTENT_TYPES = [
  "Short-form video",
  "Long-form video",
  "Carousel",
  "Thread",
  "Article",
  "Newsletter",
] as const satisfies readonly ContentType[];

export const CONTENT_TONES = [
  "Educational",
  "Entertaining",
  "Inspirational",
  "Professional",
  "Casual",
  "Bold",
] as const satisfies readonly ContentTone[];

export const CODING_TARGETS = [
  "Web app",
  "API",
  "CLI",
  "Mobile",
  "Library",
  "Script",
] as const satisfies readonly CodingTarget[];

export const EXPERIENCE_LEVELS = [
  "Beginner",
  "Intermediate",
  "Advanced",
] as const satisfies readonly ExperienceLevel[];

export const PROMPT_STYLES = [
  "Concise",
  "Detailed",
  "Step-by-step",
  "Production-ready",
] as const satisfies readonly PromptStyle[];

export const ROBLOX_GENRES = [
  "Obby",
  "Simulator",
  "Tycoon",
  "Horror",
  "Roleplay",
  "Combat",
  "Puzzle",
  "Racing",
] as const satisfies readonly RobloxGenre[];

export const ROBLOX_AUDIENCES = [
  "Kids",
  "Teens",
  "All ages",
  "Mature",
] as const satisfies readonly RobloxAudience[];

export const ROBLOX_ART_STYLES = [
  "Low poly",
  "Realistic",
  "Cartoon",
  "Voxel",
  "Stylized",
] as const satisfies readonly RobloxArtStyle[];

export const ROBLOX_MONETIZATION = [
  "Game Passes",
  "Developer Products",
  "Premium Payouts",
  "Cosmetic Shop",
  "Hybrid",
] as const satisfies readonly RobloxMonetization[];

export const PLANNER_GOALS = [
  "Grow audience",
  "Drive sales",
  "Build authority",
  "Stay consistent",
  "Launch product",
] as const satisfies readonly PlannerGoal[];

export function requireEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
): T {
  if (typeof value !== "string" || !value.trim()) {
    throw new GenerationServiceError(
      "invalid_request",
      `${field} is required`,
    );
  }
  const trimmed = value.trim() as T;
  if (!allowed.includes(trimmed)) {
    throw new GenerationServiceError(
      "invalid_request",
      `${field} must be one of: ${allowed.join(", ")}`,
    );
  }
  return trimmed;
}

export function coerceEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  if (typeof value === "string") {
    const trimmed = value.trim() as T;
    if (allowed.includes(trimmed)) return trimmed;
  }
  return fallback;
}
