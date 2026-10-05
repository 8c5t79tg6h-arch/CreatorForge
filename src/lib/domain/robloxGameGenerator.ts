import type {
  RobloxGameInput,
  RobloxGameResult,
  RobloxGameSections,
} from "@/lib/domain/types";

function buildSections(input: RobloxGameInput): RobloxGameSections {
  const features = input.desiredFeatures?.trim();
  const extras = input.additionalRequirements?.trim();
  return {
    concept: `${input.idea} — a ${input.genre.toLowerCase()} experience for ${input.audience.toLowerCase()} players with a ${input.artStyle.toLowerCase()} look.`,
    coreLoop: `Players repeatedly ${input.coreGameplay.toLowerCase()}, earn progress, unlock upgrades, and return for short sessions that still reward mastery.`,
    systems: [
      "Session join → onboarding tip → first win in under 60 seconds",
      `Primary loop: ${input.coreGameplay}`,
      "Soft currency + upgrade ladder",
      features
        ? `Feature emphasis: ${features}`
        : "Social presence (emotes / simple party cues)",
      "Retention hook: daily goal + streak cosmetic",
    ],
    progression: `Early game teaches ${input.coreGameplay.toLowerCase()} quickly. Mid game introduces meaningful choices and light specialization. Late game focuses on mastery, cosmetics, and social flex.`,
    monetizationPlan: `Monetization leans on ${input.monetization}. Keep paid advantages cosmetic or convenience-first so free players can still complete the core loop.`,
    mapAndWorld: `Design a readable ${input.artStyle.toLowerCase()} hub with clear landmarks, short travel times, and one hero set piece that communicates the fantasy of "${input.idea}".`,
    mvpScope: [
      "Playable core loop with win/fail feedback",
      "One upgrade path and one currency sink",
      "Basic lobby + respawn flow",
      "Simple onboarding tooltip",
      extras ? `Must-include: ${extras}` : "Save progress between sessions",
    ],
    stretchGoals: [
      "Seasonal event track",
      "Limited cosmetic drop",
      "Party/co-op modifier",
      "Creator showcase map variant",
    ],
  };
}

export function composeFullPlan(
  input: RobloxGameInput,
  sections: RobloxGameSections,
): string {
  return [
    `# Roblox Game Plan`,
    ``,
    `## Concept`,
    sections.concept,
    ``,
    `## Core Loop`,
    sections.coreLoop,
    ``,
    `## Systems`,
    ...sections.systems.map((item) => `- ${item}`),
    ``,
    `## Progression`,
    sections.progression,
    ``,
    `## Monetization`,
    sections.monetizationPlan,
    ``,
    `## Map & World`,
    sections.mapAndWorld,
    ``,
    `## MVP Scope`,
    ...sections.mvpScope.map((item) => `- ${item}`),
    ``,
    `## Stretch Goals`,
    ...sections.stretchGoals.map((item) => `- ${item}`),
    ``,
    `## Brief`,
    `Genre: ${input.genre} · Audience: ${input.audience} · Art: ${input.artStyle} · Monetization: ${input.monetization}`,
  ].join("\n");
}

export function generateRobloxGame(input: RobloxGameInput): RobloxGameResult {
  const sections = buildSections(input);
  return {
    sections,
    fullPlan: composeFullPlan(input, sections),
  };
}
