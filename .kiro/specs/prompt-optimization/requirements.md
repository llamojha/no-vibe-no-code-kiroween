# Requirements Document

## Introduction

This specification defines the requirements for fine-tuning AI prompts across three key features of the No Vibe No Code platform: the Classic Analyzer (startup idea validator), the Kiroween Hackathon Analyzer, and the Doctor Frankenstein idea generator. The goal is to improve response quality, consistency, and relevance by enhancing the prompt text itself, without changing system behavior, adding new features, or modifying the UI.

## Glossary

- **System**: The No Vibe No Code AI-powered product management platform
- **Classic Analyzer**: The startup idea evaluation feature that provides comprehensive analysis and scoring
- **Kiroween Analyzer**: The hackathon project evaluation feature with category-specific scoring
- **Doctor Frankenstein**: The random technology mashup idea generator feature
- **Prompt**: The structured instructions sent to the AI model to generate responses
- **Idea Maturity**: The development stage of a startup idea (napkin, early, validated)
- **Chain-of-Thought**: A prompting technique where the AI explains its reasoning step-by-step
- **Hallucination**: When the AI generates false or unverifiable information

## Requirements

### Requirement 1: Enhanced Classic Analyzer Prompt Context

**User Story:** As a user validating startup ideas with the Classic Analyzer, I want the AI to provide more contextually appropriate and actionable feedback, so that I receive guidance tailored to my idea's stage of development.

#### Acceptance Criteria

1. WHEN the Classic Analyzer prompt is constructed, THE System SHALL include enhanced context setting that describes the AI as an experienced startup analyst with 15 years of experience who provides evidence-based, balanced, and actionable feedback
2. WHEN the Classic Analyzer prompt is constructed, THE System SHALL include explicit anti-hallucination instructions requiring the AI to state "I don't have recent data on..." when current information is unavailable
3. WHEN the Classic Analyzer prompt is constructed, THE System SHALL include instructions for the AI to detect idea maturity level (napkin, early, validated) and adjust tone accordingly
4. WHEN the Classic Analyzer prompt includes founder questions for napkin-stage ideas, THE System SHALL instruct the AI to reframe questions as "what good looks like" statements rather than direct questions
5. WHEN the Classic Analyzer prompt is constructed, THE System SHALL include structured reasoning instructions requiring evidence, comparison, score, justification, and improvement suggestions for each scoring decision

### Requirement 2: Enhanced Kiroween Analyzer Prompt Context

**User Story:** As a user evaluating hackathon projects with the Kiroween Analyzer, I want the AI to understand hackathon-specific constraints and Kiro features, so that I receive relevant advice for a 48-hour competition context.

#### Acceptance Criteria

1. WHEN the Kiroween Analyzer prompt is constructed, THE System SHALL include context reminding the AI this is a 48-hour hackathon project not a production system
2. WHEN the Kiroween Analyzer prompt is constructed, THE System SHALL include instructions to prioritize creativity and innovation over polish in evaluation criteria
3. WHEN the Kiroween Analyzer prompt is constructed, THE System SHALL include instructions to assess usage of Kiro features (Specs, Hooks, MCP, Steering) and rate each as Not Used, Basic, Advanced, or Innovative
4. WHEN the Kiroween Analyzer prompt is constructed, THE System SHALL include instructions to consider "demo magic" as a legitimate hackathon strategy
5. WHEN the Kiroween Analyzer prompt is constructed, THE System SHALL include category-specific depth control instructions providing detailed analysis (200-300 words) for the selected category and brief assessment (50-75 words) for other categories

### Requirement 3: Doctor Frankenstein Idea Generation Prompt

**User Story:** As a user exploring creative startup concepts with Doctor Frankenstein, I want the AI to generate coherent and meaningful technology mashup ideas, so that I receive valuable thought experiments rather than generic combinations.

#### Acceptance Criteria

1. WHEN the Doctor Frankenstein prompt is constructed, THE System SHALL include role definition describing the AI as Doctor Frankenstein, a creative mad scientist specializing in technology mashups
2. WHEN the Doctor Frankenstein prompt is constructed, THE System SHALL include quality criteria requiring synergy (technologies complement each other), specificity (avoid generic platforms), feasibility (technically possible today), and creativity (non-obvious combinations)
3. WHEN the Doctor Frankenstein prompt is constructed, THE System SHALL include a generation strategy with five steps: analyze technologies, find common ground, build narrative, reality check, and score explanation
4. WHEN the Doctor Frankenstein prompt is constructed, THE System SHALL include 2-3 example combinations showing high coherence, medium coherence, and low coherence scenarios with explanations
5. WHEN the Doctor Frankenstein prompt is constructed, THE System SHALL include tone guidelines emphasizing enthusiastic but realistic language that frames ideas as thought experiments

### Requirement 4: Anti-Hallucination Instructions

**User Story:** As a user receiving AI-generated analysis, I want the AI to clearly distinguish between facts and speculation, so that I can trust the information and make informed decisions.

#### Acceptance Criteria

1. WHEN any prompt is constructed, THE System SHALL include explicit instructions to never invent competitor names, statistics, or market data
2. WHEN any prompt is constructed, THE System SHALL include explicit instructions to distinguish between facts with sources and educated guesses labeled as such
3. WHEN any prompt is constructed, THE System SHALL include explicit instructions to state when information was not found rather than making up plausible-sounding data
4. WHEN the Classic Analyzer prompt is constructed, THE System SHALL include instructions to cite specific elements from the user's idea when providing evidence
5. WHEN any prompt is constructed, THE System SHALL include instructions to avoid absolute statements and instead use qualified language like "This suggests..." or "Consider..."

### Requirement 5: Structured Reasoning for Scoring

**User Story:** As a user receiving scored analysis, I want to understand how scores were determined, so that I can trust the evaluation and know how to improve.

#### Acceptance Criteria

1. WHEN the Classic Analyzer prompt is constructed, THE System SHALL include instructions requiring a five-step reasoning structure for each score: evidence, comparison, score, justification, and improvement
2. WHEN the Kiroween Analyzer prompt is constructed, THE System SHALL include instructions requiring explanation of how the project fits the selected category and why specific scores were assigned
3. WHEN any validator prompt is constructed, THE System SHALL include instructions to provide specific actionable suggestions rather than generic advice
4. WHEN any validator prompt is constructed, THE System SHALL include instructions to balance strengths and risks in the analysis
5. WHEN any validator prompt is constructed, THE System SHALL include instructions to ensure every criticism includes a constructive suggestion for improvement

### Requirement 6: Tone and Voice Consistency

**User Story:** As a user interacting with different features, I want each feature to maintain its unique personality, so that the experience feels cohesive and appropriate for each use case.

#### Acceptance Criteria

1. WHEN the Classic Analyzer prompt is constructed, THE System SHALL include tone guidelines for an experienced mentor personality with encouraging language for napkin ideas, supportive language for early ideas, and direct language for validated ideas
2. WHEN the Kiroween Analyzer prompt is constructed, THE System SHALL include tone guidelines for an enthusiastic hackathon judge personality that celebrates creative risks and acknowledges hackathon constraints
3. WHEN the Doctor Frankenstein prompt is constructed, THE System SHALL include tone guidelines for a playful mad scientist personality that embraces experimental nature and uses creative metaphors
4. WHEN any prompt is constructed, THE System SHALL include language pattern examples showing preferred phrasings and patterns to avoid
5. WHEN any prompt is constructed, THE System SHALL include instructions to avoid jargon without explanation and to use accessible language appropriate for the target audience
