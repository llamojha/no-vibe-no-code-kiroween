/**
 * Prompt library for AI analysis
 * Centralized exports for all prompt types and generators
 */

// Export types and constants
export {
  PromptType,
  type Locale,
  type PromptConfig,
  type PromptGenerator,
  type PromptGenerators,
} from "./constants";

// Export prompt generators
export { generateStartupIdeaPrompt } from "./startupIdea";
export { generateHackathonProjectPrompt } from "./hackathonProject";
export { generateFrankensteinPrompt } from "./frankenstein";

// Import for promptGenerators object
import { generateStartupIdeaPrompt } from "./startupIdea";
import { generateHackathonProjectPrompt } from "./hackathonProject";
import { generateFrankensteinPrompt } from "./frankenstein";
import { PromptType, type PromptGenerators } from "./constants";

/**
 * Map of prompt generators by type
 * Allows dynamic selection of prompt generator based on PromptType
 */
export const promptGenerators: PromptGenerators = {
  [PromptType.STARTUP_IDEA]: generateStartupIdeaPrompt,
  [PromptType.HACKATHON_PROJECT]: (input: string, locale) => {
    // Note: hackathon prompt requires additional parameters (category)
    // This is a simplified version for the map. Use generateHackathonProjectPrompt directly
    // when you need full control over all parameters.
    return generateHackathonProjectPrompt(input, "", locale);
  },
  [PromptType.FRANKENSTEIN]: (input: string, locale) => {
    // Note: Frankenstein prompt requires additional parameters (elements array, mode)
    // This is a simplified version for the map. Use generateFrankensteinPrompt directly
    // when you need full control over all parameters.
    return generateFrankensteinPrompt([], "companies", locale);
  },
};
