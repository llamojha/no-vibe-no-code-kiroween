# Implementation Plan: AI Prompt Optimization

## Overview

This implementation plan focuses on enhancing AI prompts across three core features: Classic Analyzer, Kiroween Hackathon Analyzer, and Doctor Frankenstein. All changes are limited to prompt construction logic only - no feature behavior, APIs, or UI changes.

---

## Tasks

- [x] 1. Enhance Classic Analyzer Prompt

  - [x] 1.1 Add role context section to `generateStartupIdeaPrompt()` in lib/prompts/startupIdea.ts
    - Position AI as experienced startup analyst with 15 years experience
    - _Requirements: 4.1, 6.1_
  - [x] 1.2 Add anti-hallucination instructions
    - Require explicit "I don't have recent data on..." statements when uncertain
    - _Requirements: 4.2, 6.4_
  - [x] 1.3 Add maturity detection and tone adjustment logic
    - Detect idea stage (napkin/early/validated) based on input length and detail
    - Adjust tone based on detected maturity level
    - _Requirements: 1.1, 1.2, 5.1, 5.3, 6.5_
  - [x] 1.4 Add structured reasoning framework
    - Require five-step process for each score: evidence, comparison, score, justification, improvement
    - _Requirements: 1.3, 4.3, 4.4_
  - [x] 1.5 Add tone guidelines section
    - Include maturity-aware language patterns
    - _Requirements: 1.4, 5.4, 5.5_
  - [x] 1.6 Reframe founder questions for napkin-stage ideas
    - Convert questions to "what good looks like" statements
    - _Requirements: 1.5, 4.5_

- [x] 2. Enhance Kiroween Analyzer Prompt

  - [x] 2.1 Add hackathon context section to `generateHackathonProjectPrompt()` in lib/prompts/hackathonProject.ts
    - Explicitly state "This is a 48-hour hackathon project, not a production system"
    - _Requirements: 2.1, 4.1, 6.2_
  - [x] 2.2 Add creativity prioritization instructions
    - Prioritize creativity and innovation over polish
    - Recognize "demo magic" as legitimate hackathon strategy
    - _Requirements: 2.2, 2.5, 5.2_
  - [x] 2.3 Add Kiro feature assessment instructions
    - Implement four-level rating system (Not Used, Basic, Advanced, Innovative)
    - _Requirements: 2.3, 4.3_
  - [x] 2.4 Add category-specific depth control
    - 200-300 words for selected category, 50-75 words for others
    - _Requirements: 2.4, 4.2_
  - [x] 2.5 Add tone guidelines for hackathon judge personality
    - Enthusiastic and encouraging tone
    - _Requirements: 5.3, 5.4, 5.5, 6.4, 6.5_

- [x] 3. Create Doctor Frankenstein Prompt Module

  - [x] 3.1 Create new file lib/prompts/frankenstein.ts with `generateFrankensteinPrompt()` function
    - Set up basic function structure accepting technology elements and mode parameters
    - _Requirements: 3.1_
  - [x] 3.2 Add role definition section
    - Describe AI as "Doctor Frankenstein, creative mad scientist of startup ideas"
    - _Requirements: 3.2, 4.1, 6.3_
  - [x] 3.3 Add quality criteria section
    - Require synergy, specificity, feasibility, and creativity
    - _Requirements: 3.3, 4.3_
  - [x] 3.4 Add generation strategy with reasoning process
    - Implement five-step internal reasoning process
    - Include 2-3 example combinations showing high/medium/low coherence scenarios
    - _Requirements: 3.4, 4.2_
  - [x] 3.5 Add tone guidelines and output format instructions
    - Emphasize enthusiastic but realistic language
    - Specify two-output format (idea and summary)
    - _Requirements: 3.5, 5.3, 5.4, 5.5, 6.4, 6.5_

- [x] 4. Integrate Doctor Frankenstein Prompt into Feature

  - [x] 4.1 Update features/doctor-frankenstein/api/generateFrankensteinIdea.ts
    - Import new `generateFrankensteinPrompt` function from lib/prompts
    - _Requirements: 3.1_
  - [x] 4.2 Replace inline prompt construction
    - Remove existing inline prompt string
    - Call `generateFrankensteinPrompt()` with technology elements and mode parameters
    - _Requirements: 3.2, 3.3, 3.4, 3.5_
  - [x] 4.3 Verify existing logic remains unchanged
    - Maintain existing response parsing and error handling logic
    - _Requirements: 3.1_

- [x] 5. Update Prompt Module Exports
  - [x] 5.1 Update lib/prompts/index.ts
    - Export new `generateFrankensteinPrompt` function
    - _Requirements: 3.1_
  - [x] 5.2 Update lib/prompts/constants.ts
    - Add `FRANKENSTEIN` to `PromptType` enum
    - Update `PromptGenerators` interface to include Frankenstein prompt generator
    - _Requirements: 3.1_
  - [x] 5.3 Update promptGenerators object in lib/prompts/index.ts
    - Add Frankenstein entry mapping to `generateFrankensteinPrompt`
    - _Requirements: 3.1_

---

## Notes

- All tasks focus exclusively on prompt text optimization - no code architecture changes
- No new features, APIs, or UI components will be added
- Existing error handling, validation, and response processing remain unchanged
- Each prompt enhancement should maintain the existing JSON output format
- Token usage will increase by 150-350 tokens per request depending on feature
- Response times may increase by 0.5-1.5 seconds but remain within acceptable thresholds
- Production testing and iteration will be handled separately by the product team
