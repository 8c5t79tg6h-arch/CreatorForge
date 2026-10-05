export type ContentPlatform =
  | "YouTube"
  | "TikTok"
  | "Instagram"
  | "LinkedIn"
  | "X"
  | "Blog";

export type ContentType =
  | "Short-form video"
  | "Long-form video"
  | "Carousel"
  | "Thread"
  | "Article"
  | "Newsletter";

export type ContentTone =
  | "Educational"
  | "Entertaining"
  | "Inspirational"
  | "Professional"
  | "Casual"
  | "Bold";

export type ContentIdeaInput = {
  topic: string;
  platform: ContentPlatform;
  contentType: ContentType;
  tone: ContentTone;
  count: number;
  /** Optional creator controls */
  audience?: string;
  goal?: string;
  customInstructions?: string;
};

export type ContentIdea = {
  id: string;
  title: string;
  description: string;
  format: string;
  platform: string;
  keywords: string[];
  hook?: string;
  audience?: string;
  cta?: string;
  improvementNotes?: string;
};

export type ContentIdeaResult = {
  ideas: ContentIdea[];
};

export type CodingTarget =
  | "Web app"
  | "API"
  | "CLI"
  | "Mobile"
  | "Library"
  | "Script";

export type ExperienceLevel = "Beginner" | "Intermediate" | "Advanced";

export type PromptStyle =
  | "Concise"
  | "Detailed"
  | "Step-by-step"
  | "Production-ready";

export type CodingPromptInput = {
  idea: string;
  target: CodingTarget;
  technology: string;
  experienceLevel: ExperienceLevel;
  promptStyle: PromptStyle;
  additionalRequirements?: string;
};

export type CodingPromptSections = {
  overview: string;
  requirements: string[];
  architecture: string;
  implementationSteps: string[];
  acceptanceCriteria: string[];
  constraints: string[];
};

export type CodingPromptResult = {
  sections: CodingPromptSections;
  fullPrompt: string;
};

export type RobloxGenre =
  | "Obby"
  | "Simulator"
  | "Tycoon"
  | "Horror"
  | "Roleplay"
  | "Combat"
  | "Puzzle"
  | "Racing";

export type RobloxAudience = "Kids" | "Teens" | "All ages" | "Mature";

export type RobloxArtStyle =
  | "Low poly"
  | "Realistic"
  | "Cartoon"
  | "Voxel"
  | "Stylized";

export type RobloxMonetization =
  | "Game Passes"
  | "Developer Products"
  | "Premium Payouts"
  | "Cosmetic Shop"
  | "Hybrid";

export type RobloxGameInput = {
  idea: string;
  genre: RobloxGenre;
  coreGameplay: string;
  audience: RobloxAudience;
  artStyle: RobloxArtStyle;
  monetization: RobloxMonetization;
  desiredFeatures?: string;
  additionalRequirements?: string;
};

export type RobloxGameSections = {
  concept: string;
  coreLoop: string;
  systems: string[];
  progression: string;
  monetizationPlan: string;
  mapAndWorld: string;
  mvpScope: string[];
  stretchGoals: string[];
};

export type RobloxGameResult = {
  sections: RobloxGameSections;
  fullPlan: string;
};

export type PlannerGoal =
  | "Grow audience"
  | "Drive sales"
  | "Build authority"
  | "Stay consistent"
  | "Launch product";

export type ThirtyDayPlannerInput = {
  niche: string;
  platforms: ContentPlatform[];
  postsPerWeek: number;
  tone: ContentTone;
  goal: PlannerGoal;
  notes?: string;
};

export type PlannedPost = {
  id: string;
  day: number;
  platform: ContentPlatform;
  contentType: ContentType;
  title: string;
  hook: string;
  cta: string;
  notes: string;
};

export type ThirtyDayPlannerResult = {
  posts: PlannedPost[];
  summary: string;
};

export type GenerationKind =
  | "content-idea"
  | "coding-prompt"
  | "roblox-game"
  | "thirty-day-planner";

/** Scoped project context for AI — never include other projects. */
export type GenerationProjectContext = {
  projectName: string;
  projectDescription?: string;
  tags?: string[];
  contentTitle?: string;
  contentKind?: string;
  contentStatus?: string;
};

type WithProjectContext<T> = T & {
  projectContext?: GenerationProjectContext;
};

export type GenerationRequest = WithProjectContext<
  | { kind: "content-idea"; input: ContentIdeaInput }
  | { kind: "coding-prompt"; input: CodingPromptInput }
  | { kind: "roblox-game"; input: RobloxGameInput }
  | { kind: "thirty-day-planner"; input: ThirtyDayPlannerInput }
>;

export type GenerationResult =
  | { kind: "content-idea"; result: ContentIdeaResult }
  | { kind: "coding-prompt"; result: CodingPromptResult }
  | { kind: "roblox-game"; result: RobloxGameResult }
  | { kind: "thirty-day-planner"; result: ThirtyDayPlannerResult };
