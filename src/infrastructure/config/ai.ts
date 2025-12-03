import { GoogleGenAI } from "@google/genai";
import { getAIConfig } from "./environment";

/**
 * AI service configuration and client creation
 * Handles Google AI client instantiation with proper configuration
 */

let googleAIClient: GoogleGenAI | null = null;

/**
 * Create and configure Google AI client
 * Uses singleton pattern to ensure single client instance
 */
export function createGoogleAIClient(): GoogleGenAI {
  if (googleAIClient) {
    return googleAIClient;
  }

  const config = getAIConfig();

  googleAIClient = new GoogleGenAI({ apiKey: config.geminiApiKey });

  return googleAIClient;
}

/**
 * Get the current Google AI client instance
 * Creates one if it doesn't exist
 */
export function getGoogleAIClient(): GoogleGenAI {
  return googleAIClient || createGoogleAIClient();
}

/**
 * Reset the Google AI client (useful for testing)
 */
export function resetGoogleAIClient(): void {
  googleAIClient = null;
}

/**
 * AI service configuration for different environments
 */
export const aiServiceConfig = {
  development: {
    enableLogging: true,
    enableRetries: true,
    enableCaching: false,
  },
  production: {
    enableLogging: false,
    enableRetries: true,
    enableCaching: true,
  },
  test: {
    enableLogging: false,
    enableRetries: false,
    enableCaching: false,
  },
};

/**
 * Get AI service configuration for current environment
 */
export function getAIServiceConfig() {
  const config = getAIConfig();
  const environment =
    (process.env.NODE_ENV as keyof typeof aiServiceConfig) || "development";

  return {
    ...aiServiceConfig[environment],
    timeout: config.timeout,
    maxRetries: config.maxRetries,
    model: config.model,
  };
}

/**
 * AI service health check
 */
export async function checkAIServiceConnection(): Promise<boolean> {
  try {
    const client = getGoogleAIClient();
    const config = getAIConfig();

    // Simple test prompt using the existing API
    const result = await client.models.generateContent({
      model: config.model,
      contents: [{ parts: [{ text: "Hello" }] }],
    });

    return !!result.text;
  } catch (error) {
    console.error("AI service connection check failed:", error);
    return false;
  }
}

/**
 * Model configurations for different use cases
 * Note: Model names are now configured via GEMINI_MODEL environment variable
 */
export function getModelConfigs() {
  const config = getAIConfig();
  const model = config.model;

  return {
    ideaAnalysis: {
      model,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
      ],
    },
    hackathonAnalysis: {
      model,
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 3072,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
      ],
    },
    textToSpeech: {
      model,
      generationConfig: {
        temperature: 0.3,
        topK: 20,
        topP: 0.8,
        maxOutputTokens: 1024,
      },
    },
  };
}
