import type { GenerationProjectContext } from "@/lib/domain/types";

export type ProjectAiContext = GenerationProjectContext;

/**
 * Build scoped AI context for the active project only.
 * Never include other projects, other content IDs, or raw workspace dumps.
 */
export function buildProjectAiContext(options: {
  projectName: string;
  projectDescription?: string;
  tags?: string[];
  contentTitle?: string;
  contentKind?: string;
  contentStatus?: string;
}): ProjectAiContext {
  return {
    projectName: options.projectName.trim().slice(0, 120) || "Untitled project",
    projectDescription:
      options.projectDescription?.trim().slice(0, 400) || undefined,
    tags: (options.tags ?? [])
      .filter((tag) => typeof tag === "string" && tag.trim())
      .map((tag) => tag.trim().slice(0, 40))
      .slice(0, 12),
    contentTitle: options.contentTitle?.trim().slice(0, 160) || undefined,
    contentKind: options.contentKind,
    contentStatus: options.contentStatus,
  };
}

export function sanitizeProjectAiContext(
  raw: unknown,
): ProjectAiContext | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const value = raw as Record<string, unknown>;
  if (typeof value.projectName !== "string" || !value.projectName.trim()) {
    return undefined;
  }
  return buildProjectAiContext({
    projectName: value.projectName,
    projectDescription:
      typeof value.projectDescription === "string"
        ? value.projectDescription
        : undefined,
    tags: Array.isArray(value.tags)
      ? value.tags.filter((tag): tag is string => typeof tag === "string")
      : undefined,
    contentTitle:
      typeof value.contentTitle === "string" ? value.contentTitle : undefined,
    contentKind:
      typeof value.contentKind === "string" ? value.contentKind : undefined,
    contentStatus:
      typeof value.contentStatus === "string" ? value.contentStatus : undefined,
  });
}
