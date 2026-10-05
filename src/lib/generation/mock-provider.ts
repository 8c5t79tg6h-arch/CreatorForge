import {
  generateCodingPrompt,
  generateContentIdeas,
  generateRobloxGame,
} from "@/lib/domain";
import type { AIProvider } from "./types";

export const mockProvider: AIProvider = {
  name: "mock",
  async generateContentIdeas(input) {
    return generateContentIdeas(input);
  },
  async generateCodingPrompt(input) {
    return generateCodingPrompt(input);
  },
  async generateRobloxGame(input) {
    return generateRobloxGame(input);
  },
};
