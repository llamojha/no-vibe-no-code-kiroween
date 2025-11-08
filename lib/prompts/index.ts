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
  type PromptGenerators 
} from './constants';

// Export prompt generators
export { generateStartupIdeaPrompt } from './startupIdea';
export { generateHackathonProjectPrompt } from './hackathonProject';

// Import for promptGenerators object
import { generateStartupIdeaPrompt } from './startupIdea';
import { generateHackathonProjectPrompt } from './hackathonProject';
import { PromptType, type PromptGenerators } from './constants';

/**
 * Map of prompt generators by type
 * Allows dynamic selection of prompt generator based on PromptType
 */
export const promptGenerators: PromptGenerators = {
  [PromptType.STARTUP_IDEA]: generateStartupIdeaPrompt,
  [PromptType.HACKATHON_PROJECT]: (input: string, locale) => {
    // Note: hackathon prompt requires additional parameters (kiroUsage, category)
    // This is a simplified version for the map. Use generateHackathonProjectPrompt directly
    // when you need full control over all parameters.
    return generateHackathonProjectPrompt(input, '', '', locale);
  }
};
