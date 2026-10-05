export type ToolStatus = "available" | "soon";

export type ToolKind =
  | "content-idea"
  | "coding-prompt"
  | "roblox-game";

export type ToolDefinition = {
  slug: string;
  name: string;
  description: string;
  status: ToolStatus;
  kind?: ToolKind;
  href: string;
};

export const tools: ToolDefinition[] = [
  {
    slug: "content-idea-generator",
    name: "Content Idea Generator",
    description:
      "Generate platform-ready content ideas with formats, tones, and keywords.",
    status: "available",
    kind: "content-idea",
    href: "/dashboard/tools/content-idea-generator",
  },
  {
    slug: "ai-coding-prompt-builder",
    name: "AI Coding Prompt Builder",
    description:
      "Turn a product idea into a structured coding prompt for any stack.",
    status: "available",
    kind: "coding-prompt",
    href: "/dashboard/tools/ai-coding-prompt-builder",
  },
  {
    slug: "roblox-game-builder",
    name: "Roblox Game Builder",
    description:
      "Plan a Roblox experience with gameplay loops, systems, and monetization.",
    status: "available",
    kind: "roblox-game",
    href: "/dashboard/tools/roblox-game-builder",
  },
  {
    slug: "thirty-day-content-planner",
    name: "30-Day Content Planner",
    description:
      "Map a full month of posts across platforms — shipping soon.",
    status: "soon",
    href: "/dashboard/tools/thirty-day-content-planner",
  },
];

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return tools.find((tool) => tool.slug === slug);
}

export function getAvailableTools(): ToolDefinition[] {
  return tools.filter((tool) => tool.status === "available");
}
