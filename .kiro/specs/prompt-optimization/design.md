# Design Document: AI Prompt Optimization

## Overview

This design document outlines the approach for enhancing AI prompts across three core features of the No Vibe No Code platform: Classic Analyzer, Kiroween Hackathon Analyzer, and Doctor Frankenstein. The optimization focuses on improving prompt structure, context setting, and response quality through better instructions rather than changing system behavior or UI.

The design follows a prompt engineering approach that emphasizes:

- Clear role definition and context setting
- Explicit anti-hallucination instructions
- Structured reasoning frameworks
- Tone and voice consistency
- Stage-appropriate guidance

## Architecture

### Current Prompt System

The existing prompt system is located in `lib/prompts/` with the following structure:

```
lib/prompts/
├── startupIdea.ts          # Classic Analyzer prompts
├── hackathonProject.ts     # Kiroween Analyzer prompts
├── constants.ts            # Shared prompt constants
└── index.ts               # Exports
```

Each prompt module exports functions that construct prompts based on input parameters. The prompts are consumed by:

- `src/application/services/GoogleAIAnalysisService.ts` for Classic Analyzer
- Hackathon analysis use cases for Kiroween Analyzer
- Doctor Frankenstein generation service

### Design Decision: In-Place Enhancement

**Rationale**: We will enhance existing prompt construction functions without changing any feature behavior, APIs, or UI. This approach:

- Maintains exact same user experience and feature functionality
- No new interfaces, endpoints, or UI components
- Code changes limited to prompt construction logic only
- Focuses purely on improving AI response quality through better prompts

## Components and Interfaces

### 1. Classic Analyzer Prompt Enhancement

**File**: `lib/prompts/startupIdea.ts`

**Current Structure**: The file exports a function that constructs prompts for startup idea analysis.

**Enhanced Structure**:

```typescript
interface PromptSection {
  roleContext: string;
  antiHallucination: string;
  maturityDetection: string;
  scoringFramework: string;
  toneGuidelines: string;
}

function buildClassicAnalyzerPrompt(
  idea: string,
  maturity?: "napkin" | "early" | "validated"
): string {
  // Construct prompt with enhanced sections
}
```

**Key Enhancements**:

1. **Role Context Section**

   - Position AI as experienced startup analyst with 15 years experience
   - Emphasize evidence-based, balanced, actionable feedback
   - Set expectations for comprehensive yet accessible analysis

2. **Anti-Hallucination Instructions**

   - Explicit directive to state "I don't have recent data on..." when uncertain
   - Requirement to cite specific elements from user's idea
   - Prohibition on inventing competitor names, statistics, or market data
   - Instruction to distinguish facts from educated guesses

3. **Maturity Detection Logic**

   - If maturity not provided, instruct AI to detect from idea description
   - Napkin stage: Encourage exploration, reframe questions as "what good looks like"
   - Early stage: Balance validation with encouragement
   - Validated stage: Provide direct, actionable feedback

4. **Structured Reasoning Framework**

   - Five-step process for each score:
     1. Evidence: What from the idea supports this score?
     2. Comparison: How does this compare to similar ideas?
     3. Score: Numerical rating with justification
     4. Justification: Why this score specifically?
     5. Improvement: Specific actionable suggestions

5. **Tone Guidelines**
   - Napkin: Encouraging mentor, focus on possibilities
   - Early: Supportive coach, balance risks and opportunities
   - Validated: Direct advisor, actionable next steps
   - Avoid jargon without explanation
   - Use accessible language

**Design Decision**: Maturity-aware tone adjustment
**Rationale**: Different idea stages require different feedback approaches. Napkin ideas need encouragement and exploration, while validated ideas need direct, actionable advice. This prevents discouraging early-stage founders while providing appropriate rigor for mature ideas.

### 2. Kiroween Analyzer Prompt Enhancement

**File**: `lib/prompts/hackathonProject.ts`

**Current Structure**: Exports function for hackathon project evaluation prompts.

**Enhanced Structure**:

```typescript
interface HackathonPromptConfig {
  projectDescription: string;
  selectedCategory: string;
  githubUrl?: string;
  demoUrl?: string;
}

function buildKiroweenAnalyzerPrompt(config: HackathonPromptConfig): string {
  // Construct prompt with hackathon-specific context
}
```

**Key Enhancements**:

1. **Hackathon Context Setting**

   - Explicit reminder: "This is a 48-hour hackathon project, not a production system"
   - Evaluation criteria adjusted for time constraints
   - Emphasis on creativity and innovation over polish
   - Recognition of "demo magic" as legitimate strategy

2. **Kiro Feature Assessment**

   - Structured evaluation of Kiro feature usage:
     - Specs: Not Used / Basic / Advanced / Innovative
     - Hooks: Not Used / Basic / Advanced / Innovative
     - MCP: Not Used / Basic / Advanced / Innovative
     - Steering: Not Used / Basic / Advanced / Innovative
   - Scoring based on sophistication and creativity of usage
   - Recognition that not all features need to be used

3. **Category-Specific Depth Control**

   - Selected category: 200-300 words detailed analysis
   - Other categories: 50-75 words brief assessment
   - Prevents overly long responses while maintaining completeness
   - Focuses depth where user indicated interest

4. **Judging Criteria**

   - Innovation: Novel use of technology or approach
   - Technical Implementation: Quality given time constraints
   - Kiro Integration: Effective use of platform features
   - Presentation: Demo quality and clarity
   - Potential Impact: Value proposition and scalability

5. **Tone Guidelines**
   - Enthusiastic hackathon judge personality
   - Celebrate creative risks and experimentation
   - Acknowledge time constraints in feedback
   - Use encouraging language even for areas needing improvement

**Design Decision**: Category-specific depth control
**Rationale**: Users select a primary category of interest. Providing detailed analysis only for that category keeps responses focused and actionable while still covering all evaluation dimensions. This prevents information overload and improves response relevance.

### 3. Doctor Frankenstein Prompt Enhancement

**File**: `lib/prompts/startupIdea.ts` or new file `lib/prompts/frankenstein.ts`

**Current Structure**: Doctor Frankenstein generates a startup idea by combining two technologies, then produces a brief summary. Users can then optionally validate the generated idea using the Classic Analyzer.

**Enhanced Structure**:

```typescript
interface FrankensteinInput {
  technology1: string;
  technology2: string;
  context?: string;
}

function buildFrankensteinPrompt(input: FrankensteinInput): string {
  // Construct creative mashup generation prompt
}
```

**Key Enhancements**:

1. **Role Definition**

   - Position as "Doctor Frankenstein, creative mad scientist of startup ideas"
   - Specialization in technology mashups and unexpected combinations
   - Playful, enthusiastic personality with grounded thinking
   - Focus on "what if we combined..." scenarios

2. **Generation Quality Criteria**

   - Synergy: Technologies must complement each other meaningfully
   - Specificity: Concrete use case, not generic "platform" or "marketplace"
   - Feasibility: Must be technically possible with current technology
   - Creativity: Non-obvious, thought-provoking combinations
   - Clarity: Easy to understand the core concept quickly

3. **Two-Output Format**

   - **Idea**: 2-3 sentence startup concept combining both technologies
   - **Summary**: 1 paragraph (50-75 words) explaining the value proposition and how the technologies work together

4. **Generation Strategy (Internal Reasoning)**

   ```
   Step 1: Analyze Technologies
   - Core capabilities of each technology
   - Unique strengths and characteristics
   - Typical use cases

   Step 2: Find Synergy
   - How do they complement each other?
   - What problem space do they address together?
   - What's unique about this combination?

   Step 3: Create Concrete Use Case
   - Specific target users
   - Clear value proposition
   - Practical application

   Step 4: Craft Outputs
   - Idea: Concise, punchy concept statement
   - Summary: Expand on how it works and why it matters
   ```

5. **Example Combinations** (to include in prompt)

   - Good: "Stripe + Twilio = Payment confirmation system with voice-based fraud verification for high-value transactions"
   - Good: "Notion + Figma = Collaborative design documentation where mockups and specs live in the same workspace"
   - Avoid: "AWS + React = Cloud platform for web apps" (too generic)
   - Avoid: "Blockchain + AI = Smart decentralized intelligence" (too vague)

6. **Tone Guidelines**
   - Enthusiastic but not hyperbolic
   - Creative but grounded in reality
   - Playful language ("Frankenstein's lab", "mad science")
   - Focus on the "aha!" moment of the combination
   - Keep it concise - this is idea generation, not full analysis

**Design Decision**: Separate generation from validation
**Rationale**: Doctor Frankenstein's job is rapid idea generation with creative combinations. The output should be intriguing enough to spark interest but concise enough for quick scanning. Users who want deeper analysis can then validate the idea through the Classic Analyzer, which provides comprehensive scoring and feedback. This separation keeps the generation phase fast and fun while allowing optional depth.

## Prompt Structure

### Consistent Prompt Organization

All enhanced prompts will follow this text structure (no code changes):

```
[Role Context]
Who the AI is and what expertise it brings

[Anti-Hallucination Instructions]
Guidelines for accuracy and honesty about uncertainty

[Context-Specific Instructions]
Feature-specific guidance (maturity stages, hackathon context, etc.)

[Reasoning Framework]
How to think through the analysis

[Output Format]
Expected response structure (unchanged from current)

[Tone Guidelines]
Voice and personality for this feature

[Examples] (optional)
Sample good/bad outputs for clarity

[User Input]
The actual user's idea/project/technologies
```

This is purely the text content of prompts - no new interfaces or functions needed.

## Error Handling

### Prompt Text Only

Since this is purely prompt text optimization with no code changes:

- No new validation logic needed
- No fallback strategies required
- Existing error handling remains unchanged
- If prompts produce poor results, simply update the prompt text and redeploy

**Design Decision**: Keep existing error handling
**Rationale**: We're only changing prompt strings, not system behavior. All existing validation, error handling, and response processing remains exactly as is.

## Testing Strategy

### Production Testing Only

**Approach**: Since local testing uses mocked AI responses, all prompt quality validation will be done in production by the user.

**Testing Process**:

1. Deploy enhanced prompts to production
2. User manually tests with diverse real-world inputs
3. Evaluate response quality based on actual AI output
4. Iterate on prompts based on production results

**Test Cases to Run in Production**:

1. **Classic Analyzer**

   - Napkin stage idea (vague, exploratory)
   - Early stage idea (some validation, seeking direction)
   - Validated idea (clear metrics, ready for execution)
   - Edge cases: Very short ideas, highly technical ideas

2. **Kiroween Analyzer**

   - Projects using multiple Kiro features
   - Projects using single feature
   - Different primary categories selected

3. **Doctor Frankenstein**
   - Well-known complementary technologies
   - Obscure or niche technologies
   - Technologies from different domains

**Evaluation Criteria**:

- **Relevance**: Does response address the input appropriately?
- **Accuracy**: Are facts correct? Are uncertainties acknowledged?
- **Actionability**: Are suggestions specific and implementable?
- **Tone**: Is personality consistent with feature goals?
- **Hallucination**: Any invented data or false claims?

**Design Decision**: Production-only testing
**Rationale**: Local environment uses mocked responses, making prompt quality testing impossible locally. Real AI behavior can only be validated in production with actual API calls.

## Implementation Approach

### Simple Text Updates

1. **Classic Analyzer** - Update prompt text in `lib/prompts/startupIdea.ts`

   - Add role context and anti-hallucination instructions
   - Include maturity-aware tone guidance
   - Add structured reasoning framework

2. **Kiroween Analyzer** - Update prompt text in `lib/prompts/hackathonProject.ts`

   - Add hackathon context setting
   - Include Kiro feature assessment guidance
   - Add category-specific depth instructions

3. **Doctor Frankenstein** - Update prompt text (location TBD)

   - Add role definition and quality criteria
   - Include generation strategy guidance
   - Add example combinations

4. **Test in Production**
   - Deploy all changes
   - User validates with real inputs
   - Iterate on prompt text based on results

## Performance Considerations

### Token Usage

Enhanced prompts will be longer, increasing token consumption:

- Classic Analyzer: +200-300 tokens per request
- Kiroween Analyzer: +250-350 tokens per request
- Doctor Frankenstein: +150-250 tokens per request

**Mitigation**: The improved response quality should reduce need for re-analysis, offsetting increased prompt tokens.

### Response Time

Longer prompts may slightly increase AI processing time:

- Expected increase: 0.5-1.5 seconds per request
- Still within acceptable UX thresholds (<5s total)

**Design Decision**: Prioritize quality over speed
**Rationale**: Users value accurate, helpful responses more than marginal speed improvements. The quality gains from enhanced prompts justify modest increases in response time and token usage.

### Caching Opportunities

Prompt sections that don't change per request could be cached:

- Role context
- Anti-hallucination instructions
- Reasoning frameworks
- Tone guidelines

However, Google Gemini API handles prompt caching internally, so explicit caching may not be necessary.

## Security and Privacy

### Input Sanitization

User inputs are incorporated into prompts. Ensure:

- No prompt injection attacks possible
- Special characters properly escaped
- Input length limits enforced
- Sensitive data not logged with prompts

### Output Validation

AI responses should be validated before display:

- Check for unexpected format changes
- Sanitize any HTML or script content
- Verify JSON structure for programmatic responses
- Log anomalies for review

## Monitoring and Metrics

### Quality Metrics

Track over time:

- User satisfaction ratings (if available)
- Re-analysis rate (users running same idea multiple times)
- Average response length
- Hallucination reports from users
- Feature usage patterns

### A/B Testing Considerations

For future optimization:

- Could test prompt variations with user segments
- Compare response quality metrics
- Measure user engagement and satisfaction
- Iterate based on data

**Design Decision**: Deploy all enhancements together initially
**Rationale**: Prompt changes are interdependent and share common patterns (anti-hallucination, structured reasoning). Deploying together provides consistent experience and simplifies testing.

## Deployment and Rollback

### Simple Deployment

1. Update prompt text in `lib/prompts/` files
2. Deploy to production
3. User tests with real inputs
4. Iterate on prompt text as needed

### Easy Rollback

If prompts don't work well:

1. Revert prompt text via git history
2. Redeploy
3. No database changes, no API changes, no breaking changes possible

## Future Enhancements

### Potential Improvements

1. **Dynamic Prompt Adaptation**

   - Adjust prompts based on user feedback
   - Personalize tone based on user preferences
   - Learn from successful vs unsuccessful analyses

2. **Multi-Language Support**

   - Translate prompt instructions to Spanish
   - Maintain tone consistency across languages
   - Handle code-switching in user inputs

3. **Prompt Versioning**

   - Track prompt versions with responses
   - A/B test prompt variations
   - Analyze which prompts produce best results

4. **Context Injection**
   - Include relevant market data when available
   - Reference similar analyzed ideas
   - Provide industry-specific guidance

**Design Decision**: Keep initial implementation simple
**Rationale**: Focus on core prompt quality improvements first. Advanced features like dynamic adaptation can be added later based on user needs and usage patterns.

## Conclusion

This design enhances AI prompts across three features through structured improvements in role definition, anti-hallucination instructions, reasoning frameworks, and tone consistency. The approach improves response quality while keeping all feature behavior, APIs, and UI exactly the same.

Key design principles:

- Enhance existing prompt construction code only
- No new features, interfaces, or UI changes
- Consistent prompt structure across all features
- Explicit anti-hallucination instructions
- Stage and context-appropriate guidance
- Production testing with real AI responses
- Easy rollback via git if needed

The implementation focuses purely on improving AI response quality through better prompts and prompt construction logic, making it a low-risk, high-impact improvement to the platform's core value proposition without changing any user-facing behavior.
