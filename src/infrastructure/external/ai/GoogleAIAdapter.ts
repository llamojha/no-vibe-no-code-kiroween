import { GoogleGenAI, Modality } from "@google/genai";
import { Locale } from "../../../domain/value-objects";
import { Result, success, failure } from "../../../shared/types/common";
import { logger, LogCategory } from "@/lib/logger";
import {
  generateStartupIdeaPrompt,
  generateHackathonProjectPrompt,
  type Locale as PromptLocale,
} from "@/lib/prompts";

/**
 * Configuration for Google AI services
 */
export interface GoogleAIConfig {
  apiKey: string;
  model?: string;
  timeout?: number;
  maxRetries?: number;
}

/**
 * Analysis result from Google AI
 */
export interface AIAnalysisResult {
  score: number;
  detailedSummary: string;
  criteria: Array<{
    name: string;
    score: number;
    justification: string;
  }>;
  suggestions: string[];
}

/**
 * External service error for AI operations
 */
export class AIServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: unknown,
    public readonly operation?: string
  ) {
    super(message);
    this.name = "AIServiceError";
  }
}

/**
 * Google AI adapter for AI analysis service integration
 * Implements the external service adapter pattern for Google Gemini AI
 *
 * Uses the centralized prompt library (@/lib/prompts) for all AI prompts,
 * ensuring consistent prompt management and easy localization support.
 */
export class GoogleAIAdapter {
  private readonly client: GoogleGenAI;
  private readonly config: GoogleAIConfig;
  private readonly model: string;

  constructor(config: GoogleAIConfig) {
    this.config = config;
    this.model =
      config.model || process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
    this.client = new GoogleGenAI({ apiKey: config.apiKey });
  }

  /**
   * Analyze a startup idea using Google Gemini AI
   */
  async analyzeIdea(
    idea: string,
    locale: Locale
  ): Promise<Result<AIAnalysisResult, Error>> {
    logger.info(LogCategory.AI, "Starting idea analysis with Gemini", {
      ideaLength: idea.length,
      locale: locale.value,
      model: this.model,
    });

    const startTime = Date.now();

    return this.withRetry(async () => {
      try {
        const prompt = this.buildAnalysisPrompt(idea, locale);

        logger.debug(LogCategory.AI, "Sending request to Gemini API", {
          promptLength: prompt.length,
        });

        const response = await this.client.models.generateContent({
          model: this.model,
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            temperature: 0.3,
          },
        });

        const duration = Date.now() - startTime;

        if (duration > 10000) {
          logger.warn(LogCategory.AI, "Slow AI response detected", {
            duration,
            model: this.model,
          });
        }

        const rawText = response.text?.trim();
        if (!rawText) {
          logger.error(LogCategory.AI, "Empty response from Gemini AI", {
            duration,
          });
          return failure(
            new AIServiceError(
              "Empty response from Gemini AI",
              "EMPTY_RESPONSE",
              null,
              "analyze"
            )
          );
        }

        logger.debug(LogCategory.AI, "Received response from Gemini", {
          responseLength: rawText.length,
          duration,
        });

        // Parse with specific error handling
        try {
          const analysisResult = this.parseAnalysisResponse(rawText);

          logger.info(LogCategory.AI, "Idea analysis completed successfully", {
            score: analysisResult.score,
            criteriaCount: analysisResult.criteria.length,
            suggestionsCount: analysisResult.suggestions.length,
            duration: Date.now() - startTime,
          });

          return success(analysisResult);
        } catch (parseError) {
          logger.error(LogCategory.AI, "Failed to parse AI response", {
            error:
              parseError instanceof Error
                ? parseError.message
                : String(parseError),
            responsePreview: rawText.substring(0, 200),
          });

          if (parseError instanceof AIServiceError) {
            return failure(parseError);
          }
          return failure(
            new AIServiceError(
              "Failed to parse AI response",
              "PARSE_ERROR",
              parseError,
              "analyze"
            )
          );
        }
      } catch (error: unknown) {
        // Handle specific error types
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        // Detect rate limit errors
        if (
          errorMessage.includes("rate limit") ||
          errorMessage.includes("quota") ||
          errorMessage.includes("429")
        ) {
          logger.error(LogCategory.AI, "API rate limit exceeded", {
            duration: Date.now() - startTime,
            error: errorMessage,
          });
          return failure(
            new AIServiceError(
              "API rate limit exceeded",
              "RATE_LIMIT",
              error,
              "analyze"
            )
          );
        }

        // Detect timeout errors
        if (
          errorMessage.includes("timeout") ||
          errorMessage.includes("ETIMEDOUT") ||
          errorMessage.includes("ECONNABORTED")
        ) {
          logger.error(LogCategory.AI, "Request timeout", {
            duration: Date.now() - startTime,
            error: errorMessage,
          });
          return failure(
            new AIServiceError("Request timeout", "TIMEOUT", error, "analyze")
          );
        }

        // Generic error
        logger.error(LogCategory.AI, "Failed to analyze idea with Google AI", {
          duration: Date.now() - startTime,
          error: errorMessage,
        });
        return failure(
          new AIServiceError(
            "Failed to analyze idea with Google AI",
            "UNKNOWN_ERROR",
            error,
            "analyze"
          )
        );
      }
    });
  }

  /**
   * Analyze a hackathon project using Google Gemini AI
   */
  async analyzeHackathonProject(
    projectDescription: string,
    category: string,
    locale: Locale
  ): Promise<Result<AIAnalysisResult, Error>> {
    return this.withRetry(async () => {
      try {
        const prompt = this.buildHackathonAnalysisPrompt(
          projectDescription,
          category,
          locale
        );

        const response = await this.client.models.generateContent({
          model: this.model,
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            temperature: 0.3,
          },
        });

        const rawText = response.text?.trim();
        if (!rawText) {
          return failure(
            new AIServiceError(
              "Empty response from Gemini AI",
              "EMPTY_RESPONSE",
              null,
              "analyzeHackathon"
            )
          );
        }

        try {
          const analysisResult = this.parseAnalysisResponse(rawText);
          return success(analysisResult);
        } catch (parseError) {
          if (parseError instanceof AIServiceError) {
            return failure(parseError);
          }
          return failure(
            new AIServiceError(
              "Failed to parse AI response",
              "PARSE_ERROR",
              parseError,
              "analyzeHackathon"
            )
          );
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        if (
          errorMessage.includes("rate limit") ||
          errorMessage.includes("quota") ||
          errorMessage.includes("429")
        ) {
          return failure(
            new AIServiceError(
              "API rate limit exceeded",
              "RATE_LIMIT",
              error,
              "analyzeHackathon"
            )
          );
        }

        if (
          errorMessage.includes("timeout") ||
          errorMessage.includes("ETIMEDOUT") ||
          errorMessage.includes("ECONNABORTED")
        ) {
          return failure(
            new AIServiceError(
              "Request timeout",
              "TIMEOUT",
              error,
              "analyzeHackathon"
            )
          );
        }

        return failure(
          new AIServiceError(
            "Failed to analyze hackathon project with Google AI",
            "UNKNOWN_ERROR",
            error,
            "analyzeHackathon"
          )
        );
      }
    });
  }

  /**
   * Generate speech from text using Google AI TTS
   */
  async generateSpeech(
    text: string,
    locale: Locale
  ): Promise<Result<string, Error>> {
    try {
      const MAX_TTS_LENGTH = 15000;
      const truncatedText = text.substring(0, MAX_TTS_LENGTH);

      const prompt =
        locale.value === "es"
          ? `Por favor, lee el siguiente texto en español: ${truncatedText}`
          : `Please read the following text in English: ${truncatedText}`;

      const response = await this.client.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Kore" },
            },
          },
        },
      });

      const base64Audio =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        return failure(
          new AIServiceError(
            "Audio generation returned no data",
            "EMPTY_RESPONSE",
            null,
            "tts"
          )
        );
      }

      return success(base64Audio);
    } catch (error) {
      return failure(
        new AIServiceError(
          "Failed to generate speech with Google AI",
          "UNKNOWN_ERROR",
          error,
          "tts"
        )
      );
    }
  }

  /**
   * Transcribe audio using Google AI
   */
  async transcribeAudio(
    base64Audio: string,
    mimeType: string,
    locale: Locale
  ): Promise<Result<string, Error>> {
    try {
      const audioPart = {
        inlineData: {
          data: base64Audio,
          mimeType,
        },
      };

      const prompt =
        locale.value === "es"
          ? "Transcribe este audio de un usuario describiendo su idea."
          : "Transcribe this audio recording of a user describing their idea.";

      const response = await this.client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [audioPart, { text: prompt }] },
      });

      const transcription = response.text?.trim();
      if (!transcription) {
        return failure(
          new AIServiceError(
            "Transcription returned no text",
            "EMPTY_RESPONSE",
            null,
            "transcribe"
          )
        );
      }

      return success(transcription);
    } catch (error) {
      return failure(
        new AIServiceError(
          "Failed to transcribe audio with Google AI",
          "UNKNOWN_ERROR",
          error,
          "transcribe"
        )
      );
    }
  }

  /**
   * Build analysis prompt for startup ideas
   */
  private buildAnalysisPrompt(
    idea: string,
    locale: Locale
  ): Array<{ parts: Array<{ text: string }> }> {
    const promptLocale: PromptLocale = locale.value as PromptLocale;
    const prompt = generateStartupIdeaPrompt(idea, promptLocale);

    return [{ parts: [{ text: prompt }] }];
  }

  /**
   * Build analysis prompt for hackathon projects
   */
  private buildHackathonAnalysisPrompt(
    projectDescription: string,
    category: string,
    locale: Locale
  ): Array<{ parts: Array<{ text: string }> }> {
    const promptLocale: PromptLocale = locale.value as PromptLocale;
    const prompt = generateHackathonProjectPrompt(
      projectDescription,
      category,
      promptLocale
    );

    return [{ parts: [{ text: prompt }] }];
  }

  /**
   * Retry mechanism for transient failures
   */
  private async withRetry<T>(
    operation: () => Promise<Result<T, Error>>,
    maxRetries: number = this.config.maxRetries || 3
  ): Promise<Result<T, Error>> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const result = await operation();

      // If successful, return immediately
      if (result.success) {
        return result;
      }

      // Check if error is retryable
      const error = result.error;
      const isRetryable =
        error instanceof AIServiceError &&
        (error.code === "TIMEOUT" ||
          error.code === "RATE_LIMIT" ||
          error.code === "UNKNOWN_ERROR");

      // If not retryable or last attempt, return the error
      if (!isRetryable || attempt === maxRetries) {
        return result;
      }

      lastError = error;

      // Exponential backoff: wait 1s, 2s, 4s
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    // This should never be reached, but TypeScript needs it
    return failure(lastError || new Error("Unknown error during retry"));
  }

  /**
   * Parse AI response and extract analysis result
   */
  private parseAnalysisResponse(rawText: string): AIAnalysisResult {
    let parsed: unknown;

    // Try to parse JSON
    try {
      // Extract JSON from markdown code blocks
      const markdownMatch = rawText.match(/```(json)?\s*([\s\S]*?)\s*```/);
      let jsonText =
        markdownMatch && markdownMatch[2] ? markdownMatch[2] : rawText;

      // Find JSON object boundaries
      const firstBrace = jsonText.indexOf("{");
      const lastBrace = jsonText.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        jsonText = jsonText.substring(firstBrace, lastBrace + 1);
      }

      logger.debug(LogCategory.AI, "Attempting to parse JSON", {
        originalLength: rawText.length,
        extractedLength: jsonText.length,
        hasMarkdown: !!markdownMatch,
        preview: jsonText.substring(0, 500),
      });

      parsed = JSON.parse(jsonText);

      logger.debug(LogCategory.AI, "JSON parsed successfully", {
        keys: Object.keys(parsed as Record<string, unknown>),
      });
    } catch (error) {
      logger.error(LogCategory.AI, "Failed to parse JSON from AI response", {
        error: error instanceof Error ? error.message : String(error),
        rawTextPreview: rawText.substring(0, 1000),
        rawTextLength: rawText.length,
      });
      throw new AIServiceError(
        "Failed to parse AI response as JSON",
        "PARSE_ERROR",
        error,
        "parse"
      );
    }

    // Type guard to check if parsed is an object
    if (typeof parsed !== "object" || parsed === null) {
      throw new AIServiceError(
        "Invalid AI response format",
        "INVALID_FORMAT",
        null,
        "parse"
      );
    }

    const parsedObj = parsed as Record<string, unknown>;

    // Log what we received
    logger.debug(LogCategory.AI, "Parsed object structure", {
      keys: Object.keys(parsedObj),
      hasScore: !!parsedObj.score,
      hasDetailedSummary: !!parsedObj.detailedSummary,
      hasCriteria: !!parsedObj.criteria,
      hasSuggestions: !!parsedObj.suggestions,
      hasScoringRubric: !!parsedObj.scoringRubric,
      hasCategoryAnalysis: !!parsedObj.categoryAnalysis,
      hasCriteriaAnalysis: !!parsedObj.criteriaAnalysis,
      hasFinalScore: !!parsedObj.finalScore,
      hasFounderQuestions: !!parsedObj.founderQuestions,
      hasSwotAnalysis: !!parsedObj.swotAnalysis,
    });

    // Validate required fields - support multiple formats
    const hasBasicFormat = parsedObj.detailedSummary;
    const hasOldFormat =
      parsedObj.score && parsedObj.criteria && parsedObj.suggestions;
    const hasStartupFormat = parsedObj.scoringRubric && parsedObj.finalScore;
    const hasHackathonFormat =
      parsedObj.categoryAnalysis && parsedObj.criteriaAnalysis;

    if (!hasBasicFormat) {
      logger.error(
        LogCategory.AI,
        "Invalid AI response format - missing detailedSummary",
        {
          keys: Object.keys(parsedObj),
          sample: JSON.stringify(parsedObj).substring(0, 500),
        }
      );
      throw new AIServiceError(
        "Invalid AI response format - missing required field: detailedSummary",
        "INVALID_FORMAT",
        null,
        "parse"
      );
    }

    logger.info(LogCategory.AI, "Response format detected", {
      hasOldFormat,
      hasStartupFormat,
      hasHackathonFormat,
    });

    // Validate and normalize score value (for old format or as fallback)
    let score: number = 0;

    if (parsedObj.score !== undefined) {
      if (typeof parsedObj.score === "number") {
        score = parsedObj.score;
      } else if (typeof parsedObj.score === "string") {
        // Try to parse string as number
        score = parseFloat(parsedObj.score);
        if (isNaN(score)) {
          logger.error(LogCategory.AI, "Score is not a valid number", {
            scoreValue: parsedObj.score,
            scoreType: typeof parsedObj.score,
          });
          score = 0;
        }
      }

      // Validate score range
      if (score < 0 || score > 100) {
        logger.warn(LogCategory.AI, "Score out of range, clamping", {
          originalScore: score,
          clampedScore: Math.max(0, Math.min(100, score)),
        });
        score = Math.max(0, Math.min(100, score));
      }
    } else if (parsedObj.finalScore !== undefined) {
      // New format uses finalScore (0-5 scale)
      if (typeof parsedObj.finalScore === "number") {
        score = parsedObj.finalScore * 20; // Convert 0-5 to 0-100
      }
    }

    // Normalize criteria - handle both 'criteria' and 'scoringRubric'
    const criteriaArray = Array.isArray(parsedObj.criteria)
      ? parsedObj.criteria
      : Array.isArray(parsedObj.scoringRubric)
      ? parsedObj.scoringRubric
      : [];

    const normalizedCriteria = criteriaArray.map((c: unknown) => {
      const criterion = c as Record<string, unknown>;

      // Parse criterion score (can be number or string, and can be 0-5 or 0-100 scale)
      let criterionScore = 0;
      if (typeof criterion.score === "number") {
        criterionScore = criterion.score;
        // If score is in 0-5 range, convert to 0-100
        if (criterionScore <= 5) {
          criterionScore = criterionScore * 20;
        }
      } else if (typeof criterion.score === "string") {
        criterionScore = parseFloat(criterion.score);
        if (!isNaN(criterionScore) && criterionScore <= 5) {
          criterionScore = criterionScore * 20;
        }
      }

      return {
        name: typeof criterion.name === "string" ? criterion.name : "Unknown",
        score: Math.max(0, Math.min(100, criterionScore)),
        justification:
          typeof criterion.justification === "string"
            ? criterion.justification
            : "",
      };
    });

    // Normalize suggestions - handle both 'suggestions' and 'improvementSuggestions'
    const suggestionsArray = Array.isArray(parsedObj.suggestions)
      ? parsedObj.suggestions.filter((s) => typeof s === "string")
      : Array.isArray(parsedObj.improvementSuggestions)
      ? parsedObj.improvementSuggestions.map((s: unknown) => {
          const suggestion = s as Record<string, unknown>;
          // Prefer snippet (for hackathon analyzer), fallback to description (for idea analyzer)
          return typeof suggestion.snippet === "string"
            ? suggestion.snippet
            : typeof suggestion.description === "string"
            ? suggestion.description
            : String(s);
        })
      : [];

    // Build base result with normalized fields
    const baseResult = {
      score,
      detailedSummary:
        typeof parsedObj.detailedSummary === "string"
          ? parsedObj.detailedSummary
          : "",
      criteria: normalizedCriteria,
      suggestions: suggestionsArray,
    };

    // Merge with any additional fields from the parsed object (for new formats)
    // This preserves fields like founderQuestions, swotAnalysis, categoryAnalysis, etc.
    const result = {
      ...baseResult,
      ...parsedObj,
    } as AIAnalysisResult;

    logger.debug(LogCategory.AI, "Normalized analysis result", {
      score: result.score,
      criteriaCount: result.criteria.length,
      suggestionsCount: result.suggestions.length,
      additionalFields: Object.keys(parsedObj).filter(
        (k) =>
          !["score", "detailedSummary", "criteria", "suggestions"].includes(k)
      ),
    });

    return result;
  }

  /**
   * Create a configured GoogleAIAdapter instance
   */
  static create(apiKey?: string, model?: string): GoogleAIAdapter {
    const key = apiKey || process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!key) {
      throw new Error(
        "GEMINI_API_KEY environment variable not set. Configure it in your environment or pass it directly."
      );
    }

    return new GoogleAIAdapter({
      apiKey: key,
      model: model || process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
      timeout: 30000,
      maxRetries: 3,
    });
  }
}
