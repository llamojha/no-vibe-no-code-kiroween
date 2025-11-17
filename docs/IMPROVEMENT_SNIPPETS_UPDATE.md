# Improvement Snippets Update

## Overview

Updated the Kiroween hackathon validator to generate **text snippets** that users can click to add directly to their project description, which will improve their score when re-analyzed.

## Use Case Flow

1. User submits a hackathon project idea
2. Validator analyzes and provides a score
3. User sees "Refine Your Project" suggestions with clickable snippets
4. User clicks a snippet → it's appended to their project description
5. User re-analyzes → receives a higher score

## Changes Made

### 1. Prompt Updates (`lib/prompts/hackathonProject.ts`)

#### Added Snippet Generation Instructions

- Changed `description` field to `snippet` in the JSON response format
- Added detailed instructions for generating snippets:
  - Must be 2-4 sentences that extend the original idea
  - Written in first person (as if the user wrote it)
  - Address specific weaknesses identified in evaluation
  - Add concrete details about implementation, features, or Kiro usage
  - Focus on criteria with lowest scores

#### Example Snippet Format

```
"The project will use Kiro Hooks to automate testing after every code change,
and Specs to document requirements for each component. The interface will
include custom CSS animations with Halloween theming and spooky sound effects
to enhance the user experience."
```

### 2. Type Updates (`lib/types.ts`)

Updated `ImprovementSuggestion` interface:

```typescript
export interface ImprovementSuggestion {
  title: string;
  description?: string; // Legacy field for idea analyzer
  snippet?: string; // Text snippet to add to project description (for hackathon analyzer)
}
```

### 3. Component Updates (`features/kiroween-analyzer/components/HackathonAnalysisDisplay.tsx`)

Updated to use `snippet` field with fallback to `description`:

```typescript
<p className="text-slate-400 text-base mt-1">
  {suggestion.snippet || suggestion.description}
</p>

onClick={() =>
  onRefineSuggestion(
    suggestion.snippet || suggestion.description || "",
    suggestion.title,
    index
  )
}
```

## Prompt Sections for Suggestions

The hackathon validator prompt now includes these key sections:

### Spanish Version (Lines ~120-140)

```
GENERACIÓN DE SNIPPETS DE MEJORA:
Los "improvementSuggestions" deben ser snippets de texto que el usuario puede
AGREGAR directamente a su descripción del proyecto para mejorar el puntaje...
```

### English Version (Lines ~280-300)

```
IMPROVEMENT SNIPPET GENERATION:
The "improvementSuggestions" must be text snippets that users can ADD directly
to their project description to improve the score...
```

## Expected AI Behavior

The AI will now generate suggestions like:

**Title:** "Enhance Kiro Integration"
**Snippet:** "I will implement Kiro Hooks to automatically run tests and linting after each code commit, ensuring code quality throughout development. Additionally, I'll use Kiro Specs to document the API endpoints and data models, making the codebase more maintainable for future iterations."

When clicked, this snippet gets appended to the user's project description, adding concrete implementation details that will increase scores in the "Implementation" and "Quality and Design" criteria.

## Backward Compatibility

- The `description` field is still supported for the regular idea analyzer
- The hackathon analyzer will use `snippet` when available, falling back to `description`
- Existing saved analyses will continue to work

## Testing Recommendations

1. Submit a minimal hackathon project description
2. Verify suggestions appear with actionable snippets
3. Click a suggestion to add it to the description
4. Re-analyze and verify the score increases
5. Test in both English and Spanish locales
