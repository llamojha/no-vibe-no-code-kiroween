# Prompt Fine-Tuning Research: Validators & Doctor Frankenstein

## Executive Summary

This document explores strategies for fine-tuning AI prompts across three key features:

1. **Classic Analyzer Validator** - Startup idea evaluation
2. **Kiroween Hackathon Validator** - Hackathon project assessment
3. **Doctor Frankenstein Idea Generator** - Random tech mashup concept creation

The goal is to improve response quality, consistency, and relevance while maintaining the unique character of each feature.

---

## 🎯 Current State Analysis

### Classic Analyzer (Startup Validator)

**Strengths:**

- Comprehensive 10-question founder's checklist with authoritative sources
- Strong market research integration (Google Search capability)
- Detailed SWOT analysis and competitor research
- Clear scoring rubric with justifications

**Weaknesses:**

- Prompts assume founder has already started (questions about "pilot customers", "team fit")
- May be too comprehensive for early-stage ideation (overwhelming)
- Doesn't adapt tone based on idea maturity level
- Limited guidance on "what good looks like" for pre-launch ideas

**Current Prompt Length:** ~1,200 words

### Kiroween Hackathon Validator

**Strengths:**

- Category-specific evaluation (4 distinct categories)
- Multi-dimensional scoring (3 main criteria with sub-scores)
- Hackathon-specific advice and competition strategy
- Clear alignment with Kiroween theme

**Weaknesses:**

- Requires evaluation of ALL 4 categories even when only 1 is selected
- May not differentiate enough between "hackathon viable" vs "production viable"
- Limited guidance on time-boxed improvements (48-hour hackathon context)
- Doesn't consider Kiro-specific features deeply enough

**Current Prompt Length:** ~1,400 words (English version)

### Doctor Frankenstein Idea Generator

**Current State:** Not yet implemented with dedicated prompts

**Concept:** Generate creative mashup ideas from random tech combinations (companies or AWS services)

**Missing Elements:**

- No dedicated prompt for idea generation
- No quality validation for generated mashups
- No guidance on making combinations coherent vs. absurd
- No framework for evaluating mashup viability

---

## 🧪 Research: Prompt Engineering Best Practices

### 1. Prompt Structure Optimization

#### The CRISP Framework

- **C**ontext: Set the AI's role and expertise level
- **R**equirements: Define output format and constraints
- **I**nstructions: Provide step-by-step guidance
- **S**amples: Include examples of desired output
- **P**arameters: Specify tone, length, and style

#### Chain-of-Thought Prompting

- Ask AI to "think step by step" before final answer
- Improves reasoning quality by 30-50% (research: Wei et al., 2022)
- Particularly effective for complex evaluations

#### Few-Shot Learning

- Provide 2-3 examples of ideal responses
- Dramatically improves consistency
- Helps establish tone and depth expectations

### 2. Validator-Specific Techniques

#### Rubric-Based Evaluation

```
Instead of: "Evaluate the market potential"
Use: "Evaluate market potential on a 1-5 scale where:
- 5 = Clear evidence of large, growing market with urgent need
- 4 = Strong market signals with documented demand
- 3 = Moderate market with some validation
- 2 = Small or uncertain market
- 1 = No clear market or contradictory signals"
```

#### Comparative Analysis

- Ask AI to compare against similar successful/failed examples
- Grounds evaluation in real-world patterns
- Reduces arbitrary scoring

#### Evidence-Based Reasoning

- Require AI to cite specific elements from the input
- Reduces hallucination and generic responses
- Increases actionability of feedback

### 3. Idea Generation Techniques

#### Constraint-Based Creativity

- Provide specific constraints to guide creativity
- Example: "Combine these technologies to solve a problem in [domain]"
- Paradoxically, constraints increase creative output quality

#### SCAMPER Method Integration

- **S**ubstitute: What can be replaced?
- **C**ombine: What can be merged?
- **A**dapt: What can be adjusted?
- **M**odify: What can be changed?
- **P**ut to other use: New applications?
- **E**liminate: What can be removed?
- **R**everse: What can be flipped?

#### Analogical Reasoning

- Ask AI to draw parallels to successful combinations
- Example: "Uber for X" pattern recognition
- Helps validate mashup coherence

---

## 💡 Wild Ideas: Experimental Approaches

### 1. Adaptive Prompt Complexity

**Concept:** Adjust prompt depth based on input sophistication

```typescript
// Detect idea maturity level
const maturityLevel = detectMaturity(idea);

if (maturityLevel === "napkin") {
  // Use encouraging, exploratory prompts
  // Focus on "what could be" rather than "what is"
} else if (maturityLevel === "validated") {
  // Use rigorous, critical prompts
  // Focus on execution gaps and competitive threats
}
```

**Benefits:**

- More relevant feedback for idea stage
- Reduces discouragement for early ideas
- Increases rigor for mature concepts

**Challenges:**

- Requires reliable maturity detection
- May need multiple prompt templates

### 2. Persona-Based Validation

**Concept:** Evaluate from multiple expert perspectives

```
Analyze this idea from three perspectives:
1. Venture Capitalist (focus: scalability, market size, ROI)
2. Technical Architect (focus: feasibility, tech stack, complexity)
3. End User (focus: usability, value proposition, pain relief)

Provide a score and brief analysis from each perspective.
```

**Benefits:**

- Multi-dimensional evaluation
- Catches blind spots
- More comprehensive feedback

**Challenges:**

- Longer response times
- More complex to parse and display
- May overwhelm users

### 3. Competitive Simulation

**Concept:** AI plays "devil's advocate" competitor

```
Imagine you are a well-funded competitor who just learned about this idea.
How would you:
1. Copy it faster and cheaper?
2. Differentiate to win the market?
3. Use your advantages to crush this startup?

Then, suggest defensibility strategies.
```

**Benefits:**

- Surfaces competitive vulnerabilities
- Forces strategic thinking
- Highly actionable insights

**Challenges:**

- May be too negative/discouraging
- Requires careful framing

### 4. Frankenstein Coherence Scoring

**Concept:** Evaluate mashup quality before full analysis

```
Rate this technology combination on:
1. Synergy (1-10): Do these technologies complement each other?
2. Novelty (1-10): Is this combination unique and non-obvious?
3. Feasibility (1-10): Can this realistically be built?
4. Market Fit (1-10): Does this solve a real problem?

Only proceed with full analysis if total score > 25/40
```

**Benefits:**

- Filters out nonsensical combinations
- Saves API costs on low-quality mashups
- Guides users toward better combinations

**Challenges:**

- May reject creative but unconventional ideas
- Requires threshold tuning

### 5. Interactive Prompt Refinement

**Concept:** AI asks clarifying questions before analysis

```
Before I analyze your idea, I need to understand:
1. What stage is this idea? (concept / prototype / launched)
2. What's your primary goal? (validation / funding / hiring)
3. What's your biggest concern? (market / tech / competition)

[User answers]

[AI adjusts analysis focus based on answers]
```

**Benefits:**

- Highly personalized feedback
- Reduces irrelevant analysis
- Increases user engagement

**Challenges:**

- Adds friction to user flow
- Requires multi-turn conversation support
- More complex state management

---

## 🎯 Practical Ideas: Immediately Actionable

### 1. Enhanced Context Setting

**Current:**

```
You are a world-class startup analyst...
```

**Improved:**

```
You are a world-class startup analyst with 15 years of experience evaluating
early-stage companies. You've seen patterns in both successful unicorns and
failed startups. You're known for being encouraging yet realistic, and you
always provide specific, actionable feedback rather than generic advice.

Your analysis style:
- Evidence-based: Cite specific elements from the idea
- Balanced: Highlight both strengths and risks
- Actionable: Every criticism includes a suggestion
- Contextual: Consider the idea's stage and market
```

**Impact:** Sets clearer expectations for tone and depth

### 2. Explicit Anti-Hallucination Instructions

**Add to all prompts:**

```
CRITICAL RULES:
- If you don't have current information, say "I don't have recent data on..."
- Never invent competitor names, statistics, or market data
- If asked to search and you can't find information, explicitly state this
- Distinguish between facts (with sources) and educated guesses (labeled as such)
```

**Impact:** Reduces false confidence in AI responses

### 3. Structured Reasoning Chains

**For scoring decisions:**

```
For each score, follow this structure:
1. Evidence: What specific elements from the idea support this score?
2. Comparison: How does this compare to typical ideas in this space?
3. Score: Based on the evidence and comparison, assign a score
4. Justification: Explain the score in 2-3 sentences
5. Improvement: What would raise this score by 1 point?
```

**Impact:** More consistent and explainable scoring

### 4. Category-Specific Depth Control

**For Kiroween Analyzer:**

```
EVALUATION DEPTH:
- Selected Category: Provide detailed analysis (200-300 words)
- Other Categories: Provide brief assessment (50-75 words each)

This ensures the user gets deep insights on their chosen category while
understanding how the project fits other categories.
```

**Impact:** Reduces response length while maintaining value

### 5. Frankenstein Idea Generation Prompt

**New prompt structure:**

```
You are a creative product strategist specializing in technology mashups.

INPUTS:
- Technology A: [Company/Service 1]
- Technology B: [Company/Service 2]
- Technology C: [Company/Service 3]
- Mode: [companies | aws-services]

TASK:
Generate a coherent startup idea that meaningfully combines these technologies.

REQUIREMENTS:
1. Idea Title: Catchy, memorable name (2-4 words)
2. One-Liner: Elevator pitch (max 15 words)
3. Problem Statement: What specific problem does this solve? (50-75 words)
4. Solution Description: How do the technologies combine? (100-150 words)
5. Target User: Who is this for? (25-50 words)
6. Unique Value: Why is this combination special? (50-75 words)
7. First Use Case: Concrete example of usage (75-100 words)

QUALITY CRITERIA:
- Synergy: Technologies must complement each other, not just coexist
- Specificity: Avoid generic "platform" or "marketplace" descriptions
- Feasibility: Should be technically possible with current technology
- Novelty: Combination should be non-obvious and creative

TONE: Enthusiastic but grounded. This is a thought experiment, not a business plan.

OUTPUT FORMAT: Valid JSON matching the FrankensteinIdea schema
```

**Impact:** Consistent, high-quality idea generation

### 6. Validator Prompt Improvements

#### Classic Analyzer Enhancement

**Add section:**

```
IDEA MATURITY DETECTION:
Before analysis, assess if this idea is:
- Napkin Stage: Just a concept, no validation yet
- Early Stage: Some research or prototyping done
- Validated Stage: Has users, revenue, or strong signals

ADJUST YOUR ANALYSIS:
- Napkin: Focus on "what to validate first" and "how to test assumptions"
- Early: Focus on "what's working" and "what to improve"
- Validated: Focus on "scale challenges" and "competitive moats"

For Napkin stage ideas, reframe founder questions as "what good looks like":
Instead of: "Do you have pilot customers?"
Say: "Strong validation would include 3-5 potential customers who have
committed to trying a prototype or signed letters of intent."
```

#### Kiroween Analyzer Enhancement

**Add section:**

```
HACKATHON CONTEXT:
Remember this is a 48-hour hackathon project, not a production system.

EVALUATION ADJUSTMENTS:
- Prioritize creativity and innovation over polish
- Value clever hacks and rapid prototyping
- Consider "demo magic" as a legitimate strategy
- Focus on "hackathon viable" not "production ready"

KIRO FEATURE ASSESSMENT:
Evaluate how the project uses Kiro features:
- Specs: Did they use structured planning?
- Hooks: Did they automate workflows?
- MCP: Did they integrate external tools?
- Steering: Did they customize AI behavior?

Rate each feature usage as: Not Used | Basic | Advanced | Innovative
```

---

## 🔄 Hybrid Ideas: Combining Approaches

### 1. Two-Stage Validation

**Stage 1: Quick Assessment (30 seconds)**

- Basic viability check
- Category fit scoring
- Red flag detection
- Decision: Proceed to full analysis or suggest refinements?

**Stage 2: Deep Analysis (2-3 minutes)**

- Full validator analysis
- Detailed scoring and feedback
- Competitive research
- Actionable recommendations

**Benefits:**

- Faster feedback loop
- Saves API costs on low-quality inputs
- Guides users toward better submissions

### 2. Frankenstein + Validator Pipeline

**Flow:**

```
1. Generate Frankenstein Idea
   ↓
2. Quick Coherence Check (10-point scale)
   ↓
3. If score > 6: Offer validation options
   ↓
4. User chooses validator
   ↓
5. Full analysis with Frankenstein context
```

**Frankenstein Context Addition:**

```
IMPORTANT: This idea was generated by randomly combining technologies.
Evaluate it as a creative thought experiment, not a fully-formed business plan.

Focus your analysis on:
- Is the combination coherent and synergistic?
- What would it take to make this idea viable?
- What's the most promising aspect to develop further?
```

### 3. Progressive Disclosure of Feedback

**Instead of showing everything at once:**

```
Initial Display:
- Final Score
- One-sentence summary
- Top 3 strengths
- Top 3 concerns

[Expand for Details]
- Full SWOT analysis
- Detailed scoring rubric
- Competitor analysis
- Improvement suggestions

[Expand for Deep Dive]
- Founder's checklist
- Market trends
- Monetization strategies
- Next steps
```

**Benefits:**

- Less overwhelming
- Users can choose depth
- Better mobile experience
- Highlights most important insights

---

## 📊 Evaluation Metrics

### How to Measure Prompt Improvements

#### 1. Response Quality Metrics

**Consistency:**

- Run same idea through validator 5 times
- Measure score variance (should be < 0.5 points)
- Check for contradictory feedback

**Relevance:**

- User survey: "Was this feedback helpful?" (1-5 scale)
- Track which sections users expand/read
- Monitor time spent on results page

**Actionability:**

- Count specific, actionable suggestions per response
- User survey: "Did you know what to do next?" (Yes/No)
- Track follow-up actions (saves, shares, iterations)

#### 2. Technical Metrics

**Response Time:**

- Target: < 30 seconds for full analysis
- Monitor API latency
- Track timeout rates

**Token Usage:**

- Measure tokens per request
- Optimize for cost without sacrificing quality
- Target: < 4000 tokens per response

**Error Rates:**

- JSON parsing failures
- Schema validation errors
- Hallucination detection (manual review sample)

#### 3. User Engagement Metrics

**Completion Rates:**

- % of users who complete validation after generating Frankenstein
- % of users who read full analysis vs. just score
- % of users who save/share results

**Iteration Behavior:**

- Do users refine and resubmit ideas?
- Do they try multiple validators?
- Do they generate multiple Frankensteins?

**Conversion Metrics:**

- % of validated ideas that get saved
- % of users who return for more validations
- % of users who upgrade (if applicable)

---

## 🛠️ Implementation Roadmap

### Phase 1: Quick Wins (1-2 weeks)

1. **Enhanced Context Setting**

   - Update all three prompts with richer context
   - Add explicit anti-hallucination rules
   - Implement structured reasoning chains

2. **Frankenstein Idea Generator**

   - Create dedicated prompt for idea generation
   - Implement basic coherence scoring
   - Add quality validation before full analysis

3. **Validator Improvements**
   - Add idea maturity detection to Classic Analyzer
   - Add hackathon context to Kiroween Analyzer
   - Implement category-specific depth control

**Expected Impact:**

- 20-30% improvement in response relevance
- 15-20% reduction in generic feedback
- 10-15% increase in user satisfaction

### Phase 2: Structural Changes (3-4 weeks)

1. **Two-Stage Validation**

   - Implement quick assessment stage
   - Add decision logic for full analysis
   - Create refinement suggestions

2. **Adaptive Prompts**

   - Build maturity detection system
   - Create prompt variants for different stages
   - Implement dynamic prompt selection

3. **Progressive Disclosure UI**
   - Redesign results display
   - Implement expandable sections
   - Add "key insights" summary

**Expected Impact:**

- 30-40% faster time to first insight
- 25-35% increase in completion rates
- 20-25% reduction in API costs

### Phase 3: Advanced Features (5-8 weeks)

1. **Persona-Based Validation**

   - Implement multi-perspective analysis
   - Create perspective-specific prompts
   - Design comparison UI

2. **Interactive Refinement**

   - Add clarifying questions flow
   - Implement multi-turn conversations
   - Build state management system

3. **Competitive Simulation**
   - Create devil's advocate prompts
   - Add defensibility analysis
   - Implement strategic recommendations

**Expected Impact:**

- 40-50% increase in actionable insights
- 35-45% improvement in user confidence
- 30-40% increase in idea iteration rates

---

## 🎨 Tone and Voice Guidelines

### Classic Analyzer Voice

**Personality:** Experienced mentor who's seen it all

**Tone Spectrum:**

- Napkin ideas: Encouraging, exploratory, "let's figure this out together"
- Early ideas: Supportive, constructive, "here's what to focus on"
- Validated ideas: Direct, rigorous, "here are the hard truths"

**Language Patterns:**

- Use "Consider..." instead of "You should..."
- Use "Strong validation would include..." instead of "Do you have..."
- Use "This suggests..." instead of "This proves..."

**Avoid:**

- Absolute statements ("This will fail")
- Jargon without explanation
- Generic advice ("Focus on your customers")

### Kiroween Analyzer Voice

**Personality:** Enthusiastic hackathon judge who loves creativity

**Tone:** Energetic, supportive, focused on potential

**Language Patterns:**

- Celebrate creative risks
- Acknowledge hackathon constraints
- Emphasize "what could be" over "what is"
- Use hackathon-specific language ("demo magic", "hack together")

**Avoid:**

- Production-system expectations
- Overly critical feedback on polish
- Dismissing unconventional approaches

### Doctor Frankenstein Voice

**Personality:** Mad scientist with a sense of humor

**Tone:** Playful, imaginative, slightly absurd

**Language Patterns:**

- Embrace the experimental nature
- Use creative metaphors
- Acknowledge the randomness
- Focus on "what if" scenarios

**Avoid:**

- Taking combinations too seriously
- Forcing coherence where there isn't any
- Generic "platform" descriptions

---

## 🔬 A/B Testing Recommendations

### Test 1: Prompt Length

**Variant A:** Current comprehensive prompts (~1,200-1,400 words)
**Variant B:** Condensed prompts (~600-800 words)

**Hypothesis:** Shorter prompts may produce faster, more focused responses without sacrificing quality

**Metrics:** Response time, token usage, user satisfaction, score consistency

### Test 2: Reasoning Style

**Variant A:** Direct scoring (current approach)
**Variant B:** Chain-of-thought reasoning before scoring

**Hypothesis:** Explicit reasoning steps improve score accuracy and justification quality

**Metrics:** Score consistency, justification depth, user trust ratings

### Test 3: Example Inclusion

**Variant A:** No examples in prompt
**Variant B:** 1-2 example analyses in prompt (few-shot learning)

**Hypothesis:** Examples improve response consistency and format adherence

**Metrics:** JSON parsing success rate, format consistency, response quality

### Test 4: Frankenstein Coherence Threshold

**Variant A:** No coherence check (analyze everything)
**Variant B:** Coherence check with 6/10 threshold
**Variant C:** Coherence check with 7/10 threshold

**Hypothesis:** Filtering low-coherence combinations improves user experience and reduces wasted API calls

**Metrics:** User satisfaction, API cost per valuable analysis, iteration rates

### Test 5: Validator Selection

**Variant A:** User chooses validator (current)
**Variant B:** AI recommends validator based on idea characteristics

**Hypothesis:** AI recommendation increases validator-idea fit and user satisfaction

**Metrics:** Validator selection accuracy, user satisfaction, completion rates

---

## 📚 Additional Research Resources

### Academic Papers

1. **"Chain-of-Thought Prompting Elicits Reasoning in Large Language Models"** (Wei et al., 2022)

   - Key finding: Step-by-step reasoning improves accuracy by 30-50%
   - Application: Use for complex scoring decisions

2. **"Large Language Models are Zero-Shot Reasoners"** (Kojima et al., 2022)

   - Key finding: Simply adding "Let's think step by step" improves performance
   - Application: Add to all evaluation prompts

3. **"Constitutional AI: Harmlessness from AI Feedback"** (Anthropic, 2022)
   - Key finding: Self-critique loops improve response quality
   - Application: Ask AI to review its own analysis before finalizing

### Industry Best Practices

1. **OpenAI Prompt Engineering Guide**

   - Emphasizes specificity, examples, and clear instructions
   - Recommends iterative refinement with real data

2. **Anthropic's Claude Prompt Library**

   - Showcases effective prompt patterns
   - Demonstrates persona-based prompting

3. **Google's PaLM Prompting Guide**
   - Focuses on structured outputs
   - Emphasizes format consistency

### Tools for Prompt Testing

1. **PromptPerfect** - Automated prompt optimization
2. **LangSmith** - Prompt versioning and A/B testing
3. **Helicone** - Prompt analytics and monitoring
4. **Weights & Biases** - Experiment tracking

---

## 🎯 Success Criteria

### Short-term (1-2 months)

- [ ] 25% reduction in generic/unhelpful feedback (user survey)
- [ ] 90%+ JSON parsing success rate
- [ ] < 30 second average response time
- [ ] 4.0+ average user satisfaction rating (1-5 scale)
- [ ] 50%+ of users complete validation after Frankenstein generation

### Medium-term (3-6 months)

- [ ] 40% increase in actionable suggestions per response
- [ ] 30% increase in idea iteration rates
- [ ] 20% reduction in API costs per valuable analysis
- [ ] 4.2+ average user satisfaction rating
- [ ] 60%+ validator completion rate

### Long-term (6-12 months)

- [ ] 50% increase in user confidence in next steps (survey)
- [ ] 40% increase in saved/shared analyses
- [ ] 35% increase in return user rate
- [ ] 4.5+ average user satisfaction rating
- [ ] 70%+ validator completion rate

---

## 🚀 Next Steps

### Immediate Actions

1. **Audit Current Prompts**

   - Run 20 test ideas through each validator
   - Document inconsistencies and issues
   - Identify most common user complaints

2. **Create Prompt Variants**

   - Implement Phase 1 improvements
   - Set up A/B testing infrastructure
   - Define success metrics

3. **Build Frankenstein Generator**

   - Create dedicated prompt
   - Implement coherence scoring
   - Test with 50 random combinations

4. **User Research**
   - Interview 10 users about current experience
   - Identify pain points and desires
   - Validate improvement priorities

### Questions to Answer

1. What's the optimal prompt length for each validator?
2. Should we filter low-quality Frankenstein combinations?
3. How much context should we provide about idea maturity?
4. Should validators recommend each other?
5. What's the right balance between encouragement and criticism?

### Resources Needed

- **Engineering:** 2-3 weeks for Phase 1 implementation
- **Design:** UI updates for progressive disclosure
- **Research:** User interviews and A/B test analysis
- **API Budget:** Increased for testing and experimentation

---

## 📝 Conclusion

Fine-tuning prompts for validators and Doctor Frankenstein is a high-leverage opportunity to improve user experience, reduce API costs, and increase engagement. The research suggests a phased approach:

1. **Start with quick wins:** Enhanced context, anti-hallucination rules, structured reasoning
2. **Build structural improvements:** Two-stage validation, adaptive prompts, progressive disclosure
3. **Experiment with advanced features:** Persona-based validation, interactive refinement, competitive simulation

The key is to maintain the unique character of each feature while improving consistency, relevance, and actionability. Regular A/B testing and user feedback will guide optimization.

**Most Promising Opportunities:**

1. Frankenstein idea generation prompt (currently missing)
2. Adaptive prompts based on idea maturity
3. Two-stage validation for faster feedback
4. Coherence scoring for Frankenstein combinations
5. Hackathon-specific context for Kiroween validator

**Biggest Risks:**

1. Over-engineering prompts (diminishing returns)
2. Losing unique voice/personality
3. Increased response times
4. Higher API costs without proportional value

**Recommended First Step:** Implement Frankenstein idea generation prompt and test with 100 random combinations to establish baseline quality.

---

## 🎃 Doctor Frankenstein: Detailed Implementation Strategy

### Current Gap Analysis

**What's Missing:**

- No dedicated prompt for idea generation from tech combinations
- No quality control mechanism for generated mashups
- No framework to distinguish coherent vs. absurd combinations
- No guidance on making combinations meaningful vs. random

**What Exists:**

- Slot machine animation for random selection
- Two modes: Companies (356 tech companies) and AWS Services
- Integration with both validators (Kiroween and Classic Analyzer)
- Save functionality for generated ideas

### Proposed Frankenstein Generation Prompt

```
You are Doctor Frankenstein, a creative mad scientist specializing in technology mashups.
Your laboratory combines seemingly unrelated technologies to create innovative startup concepts.

ROLE & PERSONALITY:
- Enthusiastic about unconventional combinations
- Grounded in technical feasibility
- Creative but not absurd
- Focus on synergy, not just coexistence

INPUT TECHNOLOGIES:
- Technology A: {tech1}
- Technology B: {tech2}
- Technology C: {tech3}
- Mode: {companies | aws-services}
- Language: {en | es}

GENERATION TASK:
Create a coherent startup idea that meaningfully combines these technologies.
The combination should solve a real problem, not just mash technologies together randomly.

CRITICAL REQUIREMENTS:

1. SYNERGY CHECK (Internal - don't output):
   Before generating, verify:
   - Do these technologies complement each other? (Yes/No)
   - Is there a logical connection between them? (Yes/No)
   - Can they solve a problem together? (Yes/No)

   If 2+ answers are "No", acknowledge the challenge and create the most
   coherent combination possible while noting the experimental nature.

2. OUTPUT STRUCTURE (JSON format):
   {
     "idea_title": "Catchy 2-4 word name",
     "one_liner": "15-word elevator pitch",
     "problem_statement": "50-75 words: What specific problem does this solve?",
     "solution_description": "100-150 words: How do the technologies combine?",
     "target_user": "25-50 words: Who is this for?",
     "unique_value": "50-75 words: Why is this combination special?",
     "first_use_case": "75-100 words: Concrete example of usage",
     "summary": "100-150 words: Overall concept summary",
     "coherence_score": 7.5,
     "coherence_explanation": "Brief explanation of score",
     "technologies_used": [
       {
         "name": "{tech1}",
         "role": "How this technology contributes"
       },
       {
         "name": "{tech2}",
         "role": "How this technology contributes"
       },
       {
         "name": "{tech3}",
         "role": "How this technology contributes"
       }
     ]
   }

3. COHERENCE SCORING (1-10 scale):
   Rate the combination on:
   - Synergy (do technologies complement each other?): Weight 35%
   - Novelty (is this unique and non-obvious?): Weight 25%
   - Feasibility (can this be built with current tech?): Weight 25%
   - Market Fit (does this solve a real problem?): Weight 15%

   Calculate weighted average for coherence_score.

4. QUALITY CRITERIA:
   - Specificity: Avoid generic "platform for X" or "marketplace for Y"
   - Concreteness: Include specific features and workflows
   - Feasibility: Must be technically possible today
   - Value: Must solve a real, identifiable problem
   - Creativity: Should be non-obvious but not absurd

5. TONE GUIDELINES:
   - Enthusiastic but realistic
   - Acknowledge when combinations are challenging
   - Emphasize "what if" scenarios
   - Frame as thought experiment, not business plan
   - Use creative metaphors and analogies

6. LANGUAGE INSTRUCTION:
   {if language === 'es':
     "MUY IMPORTANTE: Tu respuesta completa debe estar en español,
     incluyendo todos los campos JSON."
   else:
     "VERY IMPORTANT: Your entire response must be in English,
     including all JSON fields."
   }

7. FORMAT REQUIREMENTS:
   - Response must START with { and END with }
   - No markdown code blocks or backticks
   - All strings properly escaped
   - All numeric values as numbers, not strings
   - Valid, parseable JSON

EXAMPLES OF GOOD COMBINATIONS:

Example 1 (High Coherence - 8.5/10):
Technologies: Stripe + Figma + Twilio
Idea: "DesignPay" - A design collaboration tool where clients can approve
designs and instantly pay milestones via embedded payment flows, with
automated SMS notifications for approval requests.
Why it works: Clear workflow, each tech has specific role, solves real
freelancer pain point.

Example 2 (Medium Coherence - 6.0/10):
Technologies: MongoDB + Spotify + AWS Lambda
Idea: "MoodBase" - A serverless music recommendation engine that stores
user mood patterns in MongoDB and generates Spotify playlists based on
emotional state analysis.
Why it's okay: Technologies work together but connection is less obvious,
market fit is speculative.

Example 3 (Low Coherence - 3.5/10):
Technologies: Docker + Airbnb + Slack
Idea: "ContainerStay" - A platform for... [forced combination, no clear value]
Why it fails: Technologies don't naturally complement, forced connection,
no clear problem solved.

GENERATION STRATEGY:

Step 1: Analyze Technologies
- What does each technology do best?
- What problems do they typically solve?
- What industries use them?

Step 2: Find Common Ground
- What problem space could benefit from all three?
- What user journey could incorporate all three?
- What workflow could they enhance together?

Step 3: Build the Narrative
- Start with the problem
- Show how each technology contributes
- Emphasize the synergy, not just the sum

Step 4: Reality Check
- Is this technically feasible?
- Would someone actually use this?
- Is the combination meaningful or forced?

Step 5: Score and Explain
- Calculate coherence score
- Explain what works and what's experimental
- Be honest about challenges

Now, generate a creative startup idea combining the provided technologies!
```

### Coherence Scoring System

**Scoring Matrix:**

| Score Range | Category  | Description                                          | Action                                                 |
| ----------- | --------- | ---------------------------------------------------- | ------------------------------------------------------ |
| 8.0 - 10.0  | Excellent | Natural synergy, clear value, highly feasible        | Auto-proceed to validation                             |
| 6.0 - 7.9   | Good      | Solid combination, some creativity needed            | Offer validation with encouragement                    |
| 4.0 - 5.9   | Moderate  | Forced but workable, requires significant creativity | Warn user, offer regeneration or validation            |
| 2.0 - 3.9   | Weak      | Highly forced, limited synergy                       | Suggest regeneration, allow validation if user insists |
| 0.0 - 1.9   | Poor      | No meaningful connection                             | Block validation, require regeneration                 |

**Implementation:**

```typescript
interface CoherenceResult {
  score: number;
  category: "excellent" | "good" | "moderate" | "weak" | "poor";
  shouldProceed: boolean;
  message: string;
  recommendation:
    | "auto-validate"
    | "offer-validation"
    | "warn-user"
    | "suggest-regen"
    | "block-validation";
}

function evaluateCoherence(score: number, locale: Locale): CoherenceResult {
  if (score >= 8.0) {
    return {
      score,
      category: "excellent",
      shouldProceed: true,
      message:
        locale === "es"
          ? "🎉 ¡Excelente combinación! Esta idea tiene gran sinergia."
          : "🎉 Excellent combination! This idea has great synergy.",
      recommendation: "auto-validate",
    };
  }

  if (score >= 6.0) {
    return {
      score,
      category: "good",
      shouldProceed: true,
      message:
        locale === "es"
          ? "✨ Buena combinación. Las tecnologías se complementan bien."
          : "✨ Good combination. The technologies complement each other well.",
      recommendation: "offer-validation",
    };
  }

  if (score >= 4.0) {
    return {
      score,
      category: "moderate",
      shouldProceed: true,
      message:
        locale === "es"
          ? "⚠️ Combinación experimental. Requiere creatividad para funcionar."
          : "⚠️ Experimental combination. Requires creativity to work.",
      recommendation: "warn-user",
    };
  }

  if (score >= 2.0) {
    return {
      score,
      category: "weak",
      shouldProceed: false,
      message:
        locale === "es"
          ? "🤔 Combinación forzada. ¿Quieres intentar otra vez?"
          : "🤔 Forced combination. Want to try again?",
      recommendation: "suggest-regen",
    };
  }

  return {
    score,
    category: "poor",
    shouldProceed: false,
    message:
      locale === "es"
        ? "❌ Estas tecnologías no se conectan bien. Genera otra combinación."
        : "❌ These technologies don't connect well. Generate another combination.",
    recommendation: "block-validation",
  };
}
```

### UI/UX Flow Enhancement

**Current Flow:**

```
1. Click "Create Frankenstein"
2. Slot machine animation
3. Show selected technologies
4. Generate idea (if user accepts)
5. Show full report
6. Offer validation buttons
```

**Enhanced Flow with Coherence Check:**

```
1. Click "Create Frankenstein"
2. Slot machine animation
3. Show selected technologies
4. [NEW] Quick coherence pre-check (5 seconds)
5. [NEW] Show coherence indicator
6. Generate full idea (if user accepts)
7. Show full report with coherence score
8. [NEW] Contextual validation recommendation
9. Offer validation buttons (enabled based on coherence)
```

**Coherence Indicator UI:**

```typescript
// Component for displaying coherence score
interface CoherenceIndicatorProps {
  score: number;
  explanation: string;
  locale: Locale;
}

function CoherenceIndicator({
  score,
  explanation,
  locale,
}: CoherenceIndicatorProps) {
  const result = evaluateCoherence(score, locale);

  const getColorClass = () => {
    if (score >= 8.0) return "text-green-400 border-green-600";
    if (score >= 6.0) return "text-blue-400 border-blue-600";
    if (score >= 4.0) return "text-yellow-400 border-yellow-600";
    if (score >= 2.0) return "text-orange-400 border-orange-600";
    return "text-red-400 border-red-600";
  };

  return (
    <div className={`p-4 border-2 rounded-lg ${getColorClass()}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold">
          {locale === "es" ? "Puntuación de Coherencia" : "Coherence Score"}
        </span>
        <span className="text-2xl font-bold">{score.toFixed(1)}/10</span>
      </div>
      <p className="text-sm mb-2">{result.message}</p>
      <p className="text-xs opacity-80">{explanation}</p>
    </div>
  );
}
```

### Validator Context Enhancement

When a Frankenstein idea is sent to validators, add special context:

**For Classic Analyzer:**

```
FRANKENSTEIN CONTEXT:
This idea was generated by randomly combining technologies: {tech1}, {tech2}, {tech3}.
Coherence Score: {score}/10

EVALUATION ADJUSTMENTS:
- This is a creative thought experiment, not a fully-formed business plan
- Focus on "what would it take to make this viable?" rather than "is this viable?"
- Emphasize the most promising aspects to develop further
- Acknowledge the experimental nature in your tone
- Provide constructive guidance on strengthening the concept

SPECIFIC FOCUS AREAS:
1. Which technology combination is most promising?
2. What's the strongest use case to pursue first?
3. What would need to be true for this to work?
4. How could the founder validate this concept quickly?
```

**For Kiroween Analyzer:**

```
FRANKENSTEIN CONTEXT:
This hackathon project idea combines: {tech1}, {tech2}, {tech3}.
Coherence Score: {score}/10
Generated via: Doctor Frankenstein random mashup

EVALUATION ADJUSTMENTS:
- Celebrate the creative risk-taking
- Evaluate as a 48-hour hackathon concept, not production system
- Focus on "demo magic" potential
- Consider how Kiro features could help build this quickly
- Emphasize the most hackable aspects

HACKATHON STRATEGY:
1. Which category best fits this experimental combination?
2. What's the minimum viable demo?
3. How can Kiro features accelerate development?
4. What would make judges say "wow, that's creative!"?
```

### Quality Assurance Mechanisms

**1. Pre-Generation Validation:**

```typescript
// Check if technologies are valid before generating
function validateTechnologies(
  techs: string[],
  mode: "companies" | "aws-services"
): boolean {
  // Ensure all technologies exist in the catalog
  // Ensure no duplicates
  // Ensure correct mode
  return true;
}
```

**2. Post-Generation Validation:**

```typescript
// Validate generated idea structure
function validateFrankensteinIdea(idea: any): ValidationResult {
  const schema = z.object({
    idea_title: z.string().min(2).max(50),
    one_liner: z.string().max(150),
    problem_statement: z.string().min(50).max(500),
    solution_description: z.string().min(100).max(1000),
    target_user: z.string().min(25).max(300),
    unique_value: z.string().min(50).max(500),
    first_use_case: z.string().min(75).max(700),
    summary: z.string().min(100).max(1000),
    coherence_score: z.number().min(0).max(10),
    coherence_explanation: z.string().min(20).max(500),
    technologies_used: z
      .array(
        z.object({
          name: z.string(),
          role: z.string(),
        })
      )
      .length(3),
  });

  return schema.safeParse(idea);
}
```

**3. Fallback Strategies:**

```typescript
// If generation fails or produces low-quality output
async function generateWithFallback(
  techs: string[],
  mode: string,
  locale: Locale,
  attempt: number = 1
): Promise<FrankensteinIdea> {
  try {
    const idea = await generateFrankensteinIdea(techs, mode, locale);

    if (idea.coherence_score < 2.0 && attempt < 3) {
      // Retry with adjusted prompt
      return generateWithFallback(techs, mode, locale, attempt + 1);
    }

    return idea;
  } catch (error) {
    if (attempt < 3) {
      // Retry with exponential backoff
      await delay(1000 * attempt);
      return generateWithFallback(techs, mode, locale, attempt + 1);
    }
    throw error;
  }
}
```

### Analytics & Monitoring

**Track Key Metrics:**

```typescript
interface FrankensteinMetrics {
  // Generation metrics
  avgCoherenceScore: number;
  coherenceDistribution: Record<string, number>; // excellent, good, moderate, weak, poor
  avgGenerationTime: number;
  generationFailureRate: number;

  // User behavior
  regenerationRate: number; // % who regenerate after seeing result
  validationRate: number; // % who validate after generating
  validatorPreference: Record<string, number>; // kiroween vs classic

  // Quality metrics
  avgTokensUsed: number;
  parseFailureRate: number;
  schemaValidationFailureRate: number;

  // Technology combinations
  mostSuccessfulCombos: Array<{ techs: string[]; avgScore: number }>;
  leastSuccessfulCombos: Array<{ techs: string[]; avgScore: number }>;

  // Mode comparison
  companiesModeAvgScore: number;
  awsServicesModeAvgScore: number;
}
```

**Monitoring Dashboard:**

- Real-time coherence score distribution
- Technology combination success rates
- User satisfaction by coherence tier
- Validation completion rates by coherence score
- API cost per quality tier

### A/B Testing Opportunities

**Test 1: Coherence Threshold**

- Variant A: No filtering (show all results)
- Variant B: Warn at < 6.0
- Variant C: Block at < 4.0
- Metric: User satisfaction, validation completion rate

**Test 2: Regeneration Prompts**

- Variant A: No regeneration prompt
- Variant B: Suggest regeneration for < 6.0
- Variant C: Auto-regenerate once if < 4.0
- Metric: Final idea quality, user frustration

**Test 3: Validator Recommendation**

- Variant A: User chooses validator
- Variant B: AI recommends based on coherence score
- Variant C: Auto-select validator based on idea characteristics
- Metric: Validator-idea fit, user satisfaction

**Test 4: Prompt Verbosity**

- Variant A: Full detailed prompt (~2000 words)
- Variant B: Condensed prompt (~1000 words)
- Variant C: Minimal prompt (~500 words)
- Metric: Response quality, generation time, token cost

### Success Criteria

**Phase 1 (Weeks 1-2): Basic Implementation**

- [ ] Frankenstein generation prompt implemented
- [ ] Coherence scoring functional
- [ ] Basic quality validation in place
- [ ] 80%+ JSON parse success rate
- [ ] < 45 seconds average generation time

**Phase 2 (Weeks 3-4): Quality Improvements**

- [ ] Coherence-based UI indicators working
- [ ] Validator context enhancement deployed
- [ ] Fallback strategies implemented
- [ ] 6.0+ average coherence score
- [ ] 60%+ validation completion rate

**Phase 3 (Weeks 5-6): Optimization**

- [ ] A/B tests running
- [ ] Analytics dashboard live
- [ ] User feedback collected
- [ ] 7.0+ average coherence score
- [ ] 70%+ validation completion rate
- [ ] 4.0+ user satisfaction rating

### Risk Mitigation

**Risk 1: Low Coherence Scores**

- Mitigation: Improve prompt with better examples
- Mitigation: Add technology compatibility pre-check
- Mitigation: Allow manual technology selection

**Risk 2: Slow Generation Times**

- Mitigation: Optimize prompt length
- Mitigation: Implement caching for common combinations
- Mitigation: Use streaming responses for better UX

**Risk 3: High API Costs**

- Mitigation: Implement coherence pre-check (cheaper model)
- Mitigation: Cache successful combinations
- Mitigation: Rate limit generations per user

**Risk 4: User Frustration with Bad Combinations**

- Mitigation: Set expectations ("experimental mashup")
- Mitigation: Make regeneration easy and fast
- Mitigation: Show coherence score upfront

**Risk 5: Validator Mismatch**

- Mitigation: Add Frankenstein-specific context to validators
- Mitigation: Recommend appropriate validator based on idea
- Mitigation: Allow users to try both validators

### Future Enhancements

**Phase 4+: Advanced Features**

1. **Smart Technology Selection**

   - ML model to predict high-coherence combinations
   - User preference learning
   - Industry-specific technology pools

2. **Collaborative Frankenstein**

   - Users can suggest technology combinations
   - Community voting on best mashups
   - Leaderboard of highest-coherence ideas

3. **Frankenstein Templates**

   - Pre-validated high-coherence patterns
   - Industry-specific templates
   - Problem-first approach (select problem, AI suggests techs)

4. **Integration with Validators**

   - Seamless flow from generation to validation
   - Validator results influence future generations
   - Learning from validated ideas

5. **Frankenstein Studio**
   - Manual technology selection with coherence preview
   - Real-time coherence estimation
   - Technology compatibility matrix
   - Guided combination builder

---

## 🧬 Conclusion: Doctor Frankenstein Strategy

The Doctor Frankenstein feature represents a unique opportunity to combine creativity with structure. By implementing:

1. **Robust generation prompts** with quality criteria
2. **Coherence scoring** to filter and guide
3. **Validator integration** with appropriate context
4. **Quality assurance** mechanisms
5. **Analytics and monitoring** for continuous improvement

We can create a feature that's both fun and valuable, generating genuinely interesting startup ideas from random technology combinations while maintaining quality standards.

**Key Success Factors:**

- Balance creativity with coherence
- Set appropriate user expectations
- Provide clear quality indicators
- Make regeneration easy and fast
- Learn from user behavior and feedback

**Recommended First Steps:**

1. Implement basic generation prompt (Week 1)
2. Add coherence scoring (Week 1)
3. Test with 100 random combinations (Week 2)
4. Refine based on results (Week 2)
5. Deploy with monitoring (Week 3)
6. Iterate based on user feedback (Ongoing)
