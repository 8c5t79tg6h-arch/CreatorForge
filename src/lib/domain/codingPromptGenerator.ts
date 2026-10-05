import type {
  CodingPromptInput,
  CodingPromptResult,
  CodingPromptSections,
} from "@/lib/domain/types";

function buildSections(input: CodingPromptInput): CodingPromptSections {
  const extras = input.additionalRequirements?.trim();
  return {
    overview: `Build a ${input.target.toLowerCase()} using ${input.technology} that delivers: ${input.idea}. Pitch the solution for a ${input.experienceLevel.toLowerCase()} developer with a ${input.promptStyle.toLowerCase()} prompt style.`,
    requirements: [
      `Implement the core idea: ${input.idea}`,
      `Ship as a ${input.target.toLowerCase()} on ${input.technology}`,
      `Match ${input.experienceLevel.toLowerCase()} complexity and explain tradeoffs`,
      extras
        ? `Honor additional requirements: ${extras}`
        : "Include sensible defaults when requirements are unspecified",
      "Provide clear file/module boundaries and naming",
    ],
    architecture: `Prefer a small modular layout for ${input.technology}: separate input validation, core domain logic, and presentation/IO. Keep the happy path obvious and isolate side effects.`,
    implementationSteps: [
      "Clarify inputs, outputs, and failure modes",
      `Scaffold the ${input.target.toLowerCase()} with ${input.technology}`,
      "Implement domain logic with typed models",
      "Wire UI or CLI entrypoints and error handling",
      "Add lightweight verification steps and polish",
    ],
    acceptanceCriteria: [
      "Core user flow works end-to-end",
      "Invalid input is handled without crashing",
      "Code is readable for the stated experience level",
      "README or inline notes explain how to run it",
    ],
    constraints: [
      `Stay within ${input.technology} unless an alternative is clearly better`,
      "Avoid unnecessary dependencies",
      "Do not invent unpaid third-party services as hard requirements",
      extras ? `Additional constraints: ${extras}` : "Keep scope MVP-shaped",
    ],
  };
}

export function composeFullPrompt(
  input: CodingPromptInput,
  sections: CodingPromptSections,
): string {
  return [
    `# Coding Prompt`,
    ``,
    `## Overview`,
    sections.overview,
    ``,
    `## Requirements`,
    ...sections.requirements.map((item) => `- ${item}`),
    ``,
    `## Architecture`,
    sections.architecture,
    ``,
    `## Implementation Steps`,
    ...sections.implementationSteps.map((item, i) => `${i + 1}. ${item}`),
    ``,
    `## Acceptance Criteria`,
    ...sections.acceptanceCriteria.map((item) => `- ${item}`),
    ``,
    `## Constraints`,
    ...sections.constraints.map((item) => `- ${item}`),
    ``,
    `## Style`,
    `Write a ${input.promptStyle.toLowerCase()} response suitable for a ${input.experienceLevel.toLowerCase()} engineer.`,
  ].join("\n");
}

export function generateCodingPrompt(
  input: CodingPromptInput,
): CodingPromptResult {
  const sections = buildSections(input);
  return {
    sections,
    fullPrompt: composeFullPrompt(input, sections),
  };
}
