import { GoogleGenAI } from "@google/genai";
import type { FrankensteinIdeaResult } from "@/lib/types";

export interface FrankensteinElement {
  name: string;
  description?: string;
}

export type { FrankensteinIdeaResult };

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
  } to create a new hybrid concept — a "Frankenstein Idea". You must bring that idea to life by generating a creative startup concept.

### Input:
The following elements were combined to create the Frankenstein idea:
${elementsList}

### Objective:
1. Combine these elements into a coherent startup/product concept.
2. Generate a creative idea with a title, description, and summary.
3. ${modeContext}

### Output Format:
Return a JSON object with the following structure (respond ONLY with valid JSON, no markdown).
IMPORTANT: All fields must be STRING values:
{
  "idea_title": "creative and concise name of the new concept (STRING)",
  "idea_description": "2-4 paragraphs explaining what this new idea/product is, what problem it solves, and how it works (STRING)",
  "summary": "1-2 paragraphs summarizing the viability, creative potential, and key value proposition (STRING)",
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
    core_concept: "", // No longer generated
    problem_statement: "", // No longer generated
    proposed_solution: "", // No longer generated
    unique_value_proposition: "", // No longer generated
    target_audience: "", // No longer generated
    business_model: "", // No longer generated
    growth_strategy: "", // No longer generated
    tech_stack_suggestion: "", // No longer generated
    risks_and_challenges: "", // No longer generated
    summary: ensureString(parsed.summary),
    language: parsed.language || language,
  } as FrankensteinIdeaResult;
}
