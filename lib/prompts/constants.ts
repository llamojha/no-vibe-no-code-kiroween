/**
 * Types and constants for the prompt library
 */

/**
 * Types of analysis available
 */
export enum PromptType {
  STARTUP_IDEA = 'startup_idea',
  HACKATHON_PROJECT = 'hackathon_project'
}

/**
 * Supported locales for prompts
 */
export type Locale = 'en' | 'es';

/**
 * Configuration for a prompt
 */
export interface PromptConfig {
  type: PromptType;
  locale: Locale;
}

/**
 * Function that generates a prompt
 */
export type PromptGenerator = (input: string, locale: Locale) => string;

/**
 * Map of prompt generators by type
 */
export interface PromptGenerators {
  [PromptType.STARTUP_IDEA]: PromptGenerator;
  [PromptType.HACKATHON_PROJECT]: PromptGenerator;
}
