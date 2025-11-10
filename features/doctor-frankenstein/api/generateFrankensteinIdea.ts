import { GoogleGenAI } from "@google/genai";

export interface FrankensteinElement {
  name: string;
  description?: string;
}

export interface FrankensteinIdeaResult {
  idea_title: string;
  idea_description: string;
  core_concept: string;
  problem_statement: string;
  proposed_solution: string;
  unique_value_proposition: string;
  target_audience: string;
  business_model: string;
  growth_strategy: string;
  tech_stack_suggestion: string;
  risks_and_challenges: string;
  metrics: {
    originality_score: number;
    feasibility_score: number;
    impact_score: number;
    scalability_score: number;
    wow_factor: number;
  };
  summary: string;
  language: string;
}

export async function generateFrankensteinIdea(
  elements: FrankensteinElement[],
  mode: "companies" | "aws",
  language: "en" | "es"
): Promise<FrankensteinIdeaResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
  const genAI = new GoogleGenAI({ apiKey });

  const elementsList = elements
    .map((e) => (e.description ? `${e.name} (${e.description})` : e.name))
    .join(", ");

  const modeContext =
    mode === "aws"
      ? "focus more on infrastructure, cloud scalability, and developer productivity"
      : "focus more on product synergy, market potential, and user experience";

  const prompt = `You are the AI engine of "No Vibe No Code", an intelligent product analysis system. Your task is to act as the "Doctor Frankenstein Kiroween" module.

Context:
The user has just combined multiple existing technologies ${
    mode === "aws" ? "(AWS services)" : "(tech companies)"
  } to create a new hybrid concept — a "Frankenstein Idea". You must bring that idea to life by generating a complete structured analysis report.

### Input:
The following elements were combined to create the Frankenstein idea:
${elementsList}

### Objective:
1. Combine these elements into a coherent startup/product concept.
2. Generate a detailed analysis report following the Kiroween Analyzer structure.
3. ${modeContext}

### Output Format:
Return a JSON object with the following structure (respond ONLY with valid JSON, no markdown).
IMPORTANT: All fields except "metrics" must be STRING values, not objects or arrays:
{
  "idea_title": "creative and concise name of the new concept (STRING)",
  "idea_description": "3-5 sentences explaining what this new idea/product is (STRING)",
  "core_concept": "one-line elevator pitch (STRING)",
  "problem_statement": "what problem does this solve (STRING)",
  "proposed_solution": "how the combination solves it (STRING)",
  "unique_value_proposition": "what makes this unique (STRING)",
  "target_audience": "who would use this (STRING)",
  "business_model": "how it makes money (STRING)",
  "growth_strategy": "how to scale (STRING)",
  "tech_stack_suggestion": "recommended technologies as a single paragraph (STRING, not object)",
  "risks_and_challenges": "potential obstacles as a single paragraph (STRING, not object)",
  "metrics": {
    "originality_score": 0-100,
    "feasibility_score": 0-100,
    "impact_score": 0-100,
    "scalability_score": 0-100,
    "wow_factor": 0-100
  },
  "summary": "short final paragraph summarizing viability and creative potential (STRING)",
  "language": "${language}"
}

### Tone and Style:
- Keep a slightly playful but analytical tone, in line with the Kiroween Halloween / creativity theme.
- Use vivid language and intelligent humor when appropriate.
- Maintain professional clarity and actionable insights.
- If the combination includes absurd or incompatible elements, make it work anyway — creatively justify it.
- Respond in ${language === "es" ? "Spanish" : "English"}.

Now, generate the Frankenstein Idea Report as valid JSON only.`;

  const result = await genAI.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      temperature: 0.7, // Higher temperature for more creative ideas
    },
  });

  const response = result.text?.trim() || "";

  // Clean response to extract JSON
  let jsonText = response.trim();
  if (jsonText.startsWith("```json")) {
    jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?$/g, "");
  } else if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/```\n?/g, "");
  }

  const parsed = JSON.parse(jsonText);

  // Ensure all fields are strings (convert objects to strings if needed)
  const ensureString = (value: unknown): string => {
    if (typeof value === "string") return value;
    if (typeof value === "object" && value !== null) {
      // If it's an object, convert to readable string
      if (Array.isArray(value)) {
        return value
          .map((item) =>
            typeof item === "string" ? item : JSON.stringify(item)
          )
          .join(", ");
      }
      return Object.entries(value)
        .map(([key, val]) => `${key}: ${val}`)
        .join(", ");
    }
    return String(value);
  };

  return {
    idea_title: ensureString(parsed.idea_title),
    idea_description: ensureString(parsed.idea_description),
    core_concept: ensureString(parsed.core_concept),
    problem_statement: ensureString(parsed.problem_statement),
    proposed_solution: ensureString(parsed.proposed_solution),
    unique_value_proposition: ensureString(parsed.unique_value_proposition),
    target_audience: ensureString(parsed.target_audience),
    business_model: ensureString(parsed.business_model),
    growth_strategy: ensureString(parsed.growth_strategy),
    tech_stack_suggestion: ensureString(parsed.tech_stack_suggestion),
    risks_and_challenges: ensureString(parsed.risks_and_challenges),
    metrics: {
      originality_score: Number(parsed.metrics?.originality_score) || 0,
      feasibility_score: Number(parsed.metrics?.feasibility_score) || 0,
      impact_score: Number(parsed.metrics?.impact_score) || 0,
      scalability_score: Number(parsed.metrics?.scalability_score) || 0,
      wow_factor: Number(parsed.metrics?.wow_factor) || 0,
    },
    summary: ensureString(parsed.summary),
    language: parsed.language || language,
  } as FrankensteinIdeaResult;
}
