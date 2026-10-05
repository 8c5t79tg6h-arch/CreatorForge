/**
 * Shared JSON Schema contracts for structured AI outputs.
 * Used by OpenAI (and future providers) so tools stay schema-aligned.
 */

export type JsonSchema = Record<string, unknown>;

export const contentIdeaSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["ideas"],
  properties: {
    ideas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "title",
          "description",
          "format",
          "platform",
          "keywords",
          "hook",
          "audience",
          "cta",
          "improvementNotes",
        ],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          format: { type: "string" },
          platform: { type: "string" },
          keywords: { type: "array", items: { type: "string" } },
          hook: { type: "string" },
          audience: { type: "string" },
          cta: { type: "string" },
          improvementNotes: { type: "string" },
        },
      },
    },
  },
};

export const codingPromptSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["sections"],
  properties: {
    sections: {
      type: "object",
      additionalProperties: false,
      required: [
        "overview",
        "requirements",
        "architecture",
        "implementationSteps",
        "acceptanceCriteria",
        "constraints",
      ],
      properties: {
        overview: { type: "string" },
        requirements: { type: "array", items: { type: "string" } },
        architecture: { type: "string" },
        implementationSteps: { type: "array", items: { type: "string" } },
        acceptanceCriteria: { type: "array", items: { type: "string" } },
        constraints: { type: "array", items: { type: "string" } },
      },
    },
  },
};

export const robloxGameSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["sections"],
  properties: {
    sections: {
      type: "object",
      additionalProperties: false,
      required: [
        "concept",
        "coreLoop",
        "systems",
        "progression",
        "monetizationPlan",
        "mapAndWorld",
        "mvpScope",
        "stretchGoals",
      ],
      properties: {
        concept: { type: "string" },
        coreLoop: { type: "string" },
        systems: { type: "array", items: { type: "string" } },
        progression: { type: "string" },
        monetizationPlan: { type: "string" },
        mapAndWorld: { type: "string" },
        mvpScope: { type: "array", items: { type: "string" } },
        stretchGoals: { type: "array", items: { type: "string" } },
      },
    },
  },
};

export const thirtyDayPlannerSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["posts", "summary"],
  properties: {
    summary: { type: "string" },
    posts: {
      type: "array",
      minItems: 30,
      maxItems: 30,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "day",
          "platform",
          "contentType",
          "title",
          "hook",
          "cta",
          "notes",
        ],
        properties: {
          id: { type: "string" },
          day: { type: "integer" },
          platform: { type: "string" },
          contentType: { type: "string" },
          title: { type: "string" },
          hook: { type: "string" },
          cta: { type: "string" },
          notes: { type: "string" },
        },
      },
    },
  },
};
