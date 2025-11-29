import { GoogleGenAI } from "@google/genai";
import type { FrankensteinIdeaResult } from "@/lib/types";
import { generateFrankensteinPrompt } from "@/lib/prompts/frankenstein";
import type { Locale } from "@/lib/prompts/constants";

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

  // Generate prompt using the new prompt module
  const prompt = generateFrankensteinPrompt(elements, mode, language as Locale);

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

  const parseJsonResponse = (text: string) => {
    const candidates: string[] = [];

    const trimmed = text.trim();
    if (trimmed) {
      candidates.push(trimmed);
    }

    // Fallback: grab the first JSON-looking block to handle trailing text
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      candidates.push(trimmed.slice(start, end + 1).trim());
    }

    for (const candidate of candidates) {
      try {
        return JSON.parse(candidate);
      } catch (parseError) {
        // Try the next candidate
      }
    }

    throw new Error(
      "Failed to parse Gemini response as JSON. Received response: " + trimmed
    );
  };

  const parsed = parseJsonResponse(jsonText);

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
