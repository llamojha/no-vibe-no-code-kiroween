# Prompts Library

This library contains all AI prompts used in the No Vibe No Code application. Prompts are organized by type and support multiple languages.

## Structure

```
lib/prompts/
├── constants.ts              # Type definitions and enums
├── startupIdea.ts           # Startup idea analysis prompts
├── hackathonProject.ts      # Hackathon project analysis prompts
├── index.ts                 # Central exports
├── __tests__/               # Unit tests
│   ├── startupIdea.test.ts
│   └── hackathonProject.test.ts
└── README.md                # This file
```

## Usage

### Basic Usage

```typescript
import {
  generateStartupIdeaPrompt,
  generateHackathonProjectPrompt,
} from "@/lib/prompts";

// Generate a startup idea prompt
const prompt = generateStartupIdeaPrompt("My startup idea", "en");

// Generate a hackathon project prompt
const hackathonPrompt = generateHackathonProjectPrompt(
  "Project description",
  "frankenstein",
  "es"
);
```

### Using with GoogleAIAdapter

```typescript
import { GoogleAIAdapter } from "@/src/infrastructure/external/ai/GoogleAIAdapter";
import { Locale } from "@/src/domain/value-objects";

const adapter = GoogleAIAdapter.create();
const locale = Locale.create("en");

// The adapter automatically uses the prompt library
const result = await adapter.analyzeIdea("My idea", locale);
```

## Supported Prompt Types

### Startup Idea Analysis

Analyzes startup ideas based on:

- Market Opportunity (0-20 points)
- Innovation & Uniqueness (0-20 points)
- Feasibility & Execution (0-20 points)
- Value Proposition (0-20 points)
- Scalability Potential (0-20 points)

**Function:** `generateStartupIdeaPrompt(idea: string, locale: Locale): string`

### Hackathon Project Analysis

Analyzes hackathon projects based on:

- Technical Implementation (0-25 points)
- Creativity & Originality (0-25 points)
- Theme Alignment (0-25 points)
- Completeness & Polish (0-25 points)

**Categories:**

- `frankenstein`: Projects combining different technologies
- `resurrection`: Projects reviving old technologies
- `haunted`: Projects with mysterious behaviors
- `cursed`: Projects with inherent challenges
- `possessed`: Projects with autonomous/AI behaviors

**Function:** `generateHackathonProjectPrompt(project: string, category: string, locale: Locale): string`

## Supported Languages

Currently supported locales:

- `en` - English
- `es` - Spanish (Español)

## Adding a New Prompt Type

To add a new type of prompt:

1. **Define the prompt type** in `constants.ts`:

```typescript
export enum PromptType {
  STARTUP_IDEA = "startup_idea",
  HACKATHON_PROJECT = "hackathon_project",
  YOUR_NEW_TYPE = "your_new_type", // Add here
}
```

2. **Create a new prompt file** (e.g., `yourNewType.ts`):

```typescript
import { Locale } from "./constants";

/**
 * Generates prompt for your new analysis type
 * @param input - The input to analyze
 * @param locale - The language for the analysis
 * @returns The formatted prompt
 */
export function generateYourNewTypePrompt(
  input: string,
  locale: Locale
): string {
  const prompts = {
    en: `Your English prompt template here: "${input}"`,
    es: `Tu plantilla de prompt en español aquí: "${input}"`,
  };

  return prompts[locale];
}
```

3. **Export from index.ts**:

```typescript
export { generateYourNewTypePrompt } from "./yourNewType";

export const promptGenerators: PromptGenerators = {
  [PromptType.STARTUP_IDEA]: generateStartupIdeaPrompt,
  [PromptType.HACKATHON_PROJECT]: generateHackathonProjectPrompt,
  [PromptType.YOUR_NEW_TYPE]: generateYourNewTypePrompt, // Add here
};
```

4. **Write tests** in `__tests__/yourNewType.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { generateYourNewTypePrompt } from "../yourNewType";

describe("generateYourNewTypePrompt", () => {
  it("should generate prompt in English", () => {
    const prompt = generateYourNewTypePrompt("test input", "en");
    expect(prompt).toBeTruthy();
    expect(prompt).toContain("test input");
  });

  it("should generate prompt in Spanish", () => {
    const prompt = generateYourNewTypePrompt("entrada de prueba", "es");
    expect(prompt).toBeTruthy();
    expect(prompt).toContain("entrada de prueba");
  });
});
```

## Adding Support for a New Language

To add support for a new language:

1. **Update the Locale type** in `constants.ts`:

```typescript
export type Locale = "en" | "es" | "fr"; // Add 'fr' for French
```

2. **Add translations to each prompt file**:

```typescript
export function generateStartupIdeaPrompt(
  idea: string,
  locale: Locale
): string {
  const prompts = {
    en: `English prompt...`,
    es: `Prompt en español...`,
    fr: `Prompt en français...`, // Add French translation
  };

  return prompts[locale];
}
```

3. **Update tests** to cover the new language:

```typescript
it("should generate prompt in French", () => {
  const prompt = generateStartupIdeaPrompt("mon idée", "fr");
  expect(prompt).toBeTruthy();
  expect(prompt).toContain("mon idée");
});
```

4. **Update domain layer** if needed (e.g., `src/domain/value-objects/Locale.ts`).

## Best Practices

### Prompt Design

- **Be specific**: Clearly define what you want the AI to analyze
- **Use structured output**: Request JSON format for easy parsing
- **Include examples**: Show the AI the expected format
- **Set constraints**: Define score ranges, required fields, etc.
- **Be consistent**: Use similar structure across different prompt types

### Code Organization

- **One file per prompt type**: Keep prompts separated by functionality
- **Use TypeScript**: Leverage type safety for locale and parameters
- **Document thoroughly**: Add JSDoc comments to all functions
- **Test comprehensively**: Ensure prompts work in all supported languages

### Localization

- **Maintain parity**: All languages should request the same information
- **Use native speakers**: Have translations reviewed by native speakers
- **Test thoroughly**: Verify AI responses in each language
- **Keep it simple**: Avoid idioms or cultural references that don't translate

## Testing

Run tests for the prompts library:

```bash
# Run all prompt tests
npm test -- lib/prompts

# Run specific test file
npm test -- lib/prompts/__tests__/startupIdea.test.ts

# Run with coverage
npm test -- lib/prompts --coverage
```

## Architecture

This library follows the **Ports and Adapters** pattern:

- **Domain Layer**: Defines `Locale` value object
- **Infrastructure Layer**: `GoogleAIAdapter` uses these prompts
- **Shared Library**: This prompts library is shared across the application

The prompts are **pure functions** with no side effects, making them:

- Easy to test
- Easy to version
- Easy to A/B test
- Easy to cache

## Future Enhancements

Potential improvements for this library:

- **Prompt versioning**: Support multiple versions of prompts for A/B testing
- **Dynamic prompts**: Generate prompts based on user preferences or context
- **Prompt templates**: Use template engines for more complex prompts
- **Prompt analytics**: Track which prompts perform best
- **Prompt caching**: Cache generated prompts to improve performance
- **More languages**: Add support for more languages (French, German, etc.)

## Related Documentation

- [Architecture Documentation](../../docs/ARCHITECTURE.md)
- [API Documentation](../../docs/API.md)
- [Developer Guide](../../docs/DEVELOPER_GUIDE.md)
- [GoogleAIAdapter](../../src/infrastructure/external/ai/GoogleAIAdapter.ts)

## Support

For questions or issues related to prompts:

1. Check the test files for usage examples
2. Review the design document at `.kiro/specs/prompt-refactoring/design.md`
3. Consult the requirements at `.kiro/specs/prompt-refactoring/requirements.md`
