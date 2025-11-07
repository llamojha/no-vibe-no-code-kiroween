import { GoogleGenAI, Modality } from '@google/genai';
import { Locale } from '../../../domain/value-objects';
import { Result, success, failure } from '../../../shared/types/common';
import { logger, LogCategory } from '@/lib/logger';

/**
 * Configuration for Google AI services
 */
export interface GoogleAIConfig {
  apiKey: string;
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
    this.name = 'AIServiceError';
  }
}

/**
 * Google AI adapter for AI analysis service integration
 * Implements the external service adapter pattern for Google Gemini AI
 */
export class GoogleAIAdapter {
  private readonly client: GoogleGenAI;
  private readonly config: GoogleAIConfig;

  constructor(config: GoogleAIConfig) {
    this.config = config;
    this.client = new GoogleGenAI({ apiKey: config.apiKey });
  }

  /**
   * Analyze a startup idea using Google Gemini AI
   */
  async analyzeIdea(idea: string, locale: Locale): Promise<Result<AIAnalysisResult, Error>> {
    logger.info(LogCategory.AI, 'Starting idea analysis with Gemini', {
      ideaLength: idea.length,
      locale: locale.value,
      model: 'gemini-2.5-pro'
    });

    const startTime = Date.now();

    return this.withRetry(async () => {
      try {
        const prompt = this.buildAnalysisPrompt(idea, locale);
        
        logger.debug(LogCategory.AI, 'Sending request to Gemini API', {
          promptLength: prompt.length
        });

        const response = await this.client.models.generateContent({
          model: 'gemini-2.5-pro',
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            temperature: 0.3,
          },
        });

        const duration = Date.now() - startTime;

        if (duration > 10000) {
          logger.warn(LogCategory.AI, 'Slow AI response detected', {
            duration,
            model: 'gemini-2.5-pro'
          });
        }

        const rawText = response.text?.trim();
        if (!rawText) {
          logger.error(LogCategory.AI, 'Empty response from Gemini AI', {
            duration
          });
          return failure(new AIServiceError('Empty response from Gemini AI', 'EMPTY_RESPONSE', null, 'analyze'));
        }

        logger.debug(LogCategory.AI, 'Received response from Gemini', {
          responseLength: rawText.length,
          duration
        });

        // Parse with specific error handling
        try {
          const analysisResult = this.parseAnalysisResponse(rawText);
          
          logger.info(LogCategory.AI, 'Idea analysis completed successfully', {
            score: analysisResult.score,
            criteriaCount: analysisResult.criteria.length,
            suggestionsCount: analysisResult.suggestions.length,
            duration: Date.now() - startTime
          });

          return success(analysisResult);
        } catch (parseError) {
          logger.error(LogCategory.AI, 'Failed to parse AI response', {
            error: parseError instanceof Error ? parseError.message : String(parseError),
            responsePreview: rawText.substring(0, 200)
          });

          if (parseError instanceof AIServiceError) {
            return failure(parseError);
          }
          return failure(new AIServiceError(
            'Failed to parse AI response',
            'PARSE_ERROR',
            parseError,
            'analyze'
          ));
        }
      } catch (error: unknown) {
        // Handle specific error types
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Detect rate limit errors
        if (errorMessage.includes('rate limit') || errorMessage.includes('quota') || errorMessage.includes('429')) {
          logger.error(LogCategory.AI, 'API rate limit exceeded', {
            duration: Date.now() - startTime,
            error: errorMessage
          });
          return failure(new AIServiceError(
            'API rate limit exceeded',
            'RATE_LIMIT',
            error,
            'analyze'
          ));
        }
        
        // Detect timeout errors
        if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT') || errorMessage.includes('ECONNABORTED')) {
          logger.error(LogCategory.AI, 'Request timeout', {
            duration: Date.now() - startTime,
            error: errorMessage
          });
          return failure(new AIServiceError(
            'Request timeout',
            'TIMEOUT',
            error,
            'analyze'
          ));
        }
        
        // Generic error
        logger.error(LogCategory.AI, 'Failed to analyze idea with Google AI', {
          duration: Date.now() - startTime,
          error: errorMessage
        });
        return failure(new AIServiceError(
          'Failed to analyze idea with Google AI',
          'UNKNOWN_ERROR',
          error,
          'analyze'
        ));
      }
    });
  }

  /**
   * Analyze a hackathon project using Google Gemini AI
   */
  async analyzeHackathonProject(
    projectDescription: string,
    kiroUsage: string,
    category: string,
    locale: Locale
  ): Promise<Result<AIAnalysisResult, Error>> {
    return this.withRetry(async () => {
      try {
        const prompt = this.buildHackathonAnalysisPrompt(projectDescription, kiroUsage, category, locale);
        
        const response = await this.client.models.generateContent({
          model: 'gemini-2.5-pro',
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            temperature: 0.3,
          },
        });

        const rawText = response.text?.trim();
        if (!rawText) {
          return failure(new AIServiceError('Empty response from Gemini AI', 'EMPTY_RESPONSE', null, 'analyzeHackathon'));
        }

        try {
          const analysisResult = this.parseAnalysisResponse(rawText);
          return success(analysisResult);
        } catch (parseError) {
          if (parseError instanceof AIServiceError) {
            return failure(parseError);
          }
          return failure(new AIServiceError(
            'Failed to parse AI response',
            'PARSE_ERROR',
            parseError,
            'analyzeHackathon'
          ));
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (errorMessage.includes('rate limit') || errorMessage.includes('quota') || errorMessage.includes('429')) {
          return failure(new AIServiceError(
            'API rate limit exceeded',
            'RATE_LIMIT',
            error,
            'analyzeHackathon'
          ));
        }
        
        if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT') || errorMessage.includes('ECONNABORTED')) {
          return failure(new AIServiceError(
            'Request timeout',
            'TIMEOUT',
            error,
            'analyzeHackathon'
          ));
        }
        
        return failure(new AIServiceError(
          'Failed to analyze hackathon project with Google AI',
          'UNKNOWN_ERROR',
          error,
          'analyzeHackathon'
        ));
      }
    });
  }

  /**
   * Generate speech from text using Google AI TTS
   */
  async generateSpeech(text: string, locale: Locale): Promise<Result<string, Error>> {
    try {
      const MAX_TTS_LENGTH = 15000;
      const truncatedText = text.substring(0, MAX_TTS_LENGTH);
      
      const prompt = locale.value === 'es'
        ? `Por favor, lee el siguiente texto en español: ${truncatedText}`
        : `Please read the following text in English: ${truncatedText}`;

      const response = await this.client.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        return failure(new AIServiceError('Audio generation returned no data', 'EMPTY_RESPONSE', null, 'tts'));
      }

      return success(base64Audio);
    } catch (error) {
      return failure(new AIServiceError(
        'Failed to generate speech with Google AI',
        'UNKNOWN_ERROR',
        error,
        'tts'
      ));
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

      const prompt = locale.value === 'es'
        ? 'Transcribe este audio de un usuario describiendo su idea.'
        : 'Transcribe this audio recording of a user describing their idea.';

      const response = await this.client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [audioPart, { text: prompt }] },
      });

      const transcription = response.text?.trim();
      if (!transcription) {
        return failure(new AIServiceError('Transcription returned no text', 'EMPTY_RESPONSE', null, 'transcribe'));
      }

      return success(transcription);
    } catch (error) {
      return failure(new AIServiceError(
        'Failed to transcribe audio with Google AI',
        'UNKNOWN_ERROR',
        error,
        'transcribe'
      ));
    }
  }

  /**
   * Build analysis prompt for startup ideas
   */
  private buildAnalysisPrompt(idea: string, locale: Locale): Array<{ parts: Array<{ text: string }> }> {
    const isSpanish = locale.value === 'es';
    
    const systemPrompt = isSpanish
      ? `Eres un experto analista de startups. Analiza la siguiente idea de startup y proporciona una evaluación detallada.`
      : `You are an expert startup analyst. Analyze the following startup idea and provide a detailed evaluation.`;

    const analysisPrompt = isSpanish
      ? `Analiza esta idea de startup: "${idea}"\n\nProporciona tu análisis en formato JSON con la siguiente estructura:`
      : `Analyze this startup idea: "${idea}"\n\nProvide your analysis in JSON format with the following structure:`;

    const jsonStructure = {
      score: isSpanish ? "puntuación del 0-100" : "score from 0-100",
      detailedSummary: isSpanish ? "resumen detallado de la evaluación" : "detailed summary of the evaluation",
      criteria: [
        {
          name: isSpanish ? "nombre del criterio" : "criteria name",
          score: isSpanish ? "puntuación 0-100" : "score 0-100",
          justification: isSpanish ? "justificación de la puntuación" : "justification for the score"
        }
      ],
      suggestions: [isSpanish ? "sugerencias de mejora" : "improvement suggestions"]
    };

    return [
      { parts: [{ text: systemPrompt }] },
      { parts: [{ text: `${analysisPrompt}\n\n\`\`\`json\n${JSON.stringify(jsonStructure, null, 2)}\n\`\`\`` }] }
    ];
  }

  /**
   * Build analysis prompt for hackathon projects
   */
  private buildHackathonAnalysisPrompt(
    projectDescription: string,
    kiroUsage: string,
    category: string,
    locale: Locale
  ): Array<{ parts: Array<{ text: string }> }> {
    const isSpanish = locale.value === 'es';
    
    const systemPrompt = isSpanish
      ? `Eres un experto evaluador de proyectos de hackathon. Evalúa el siguiente proyecto considerando la descripción, el uso de Kiro, y la categoría.`
      : `You are an expert hackathon project evaluator. Evaluate the following project considering the description, Kiro usage, and category.`;

    const analysisPrompt = isSpanish
      ? `Evalúa este proyecto de hackathon:
Descripción: "${projectDescription}"
Uso de Kiro: "${kiroUsage}"
Categoría: "${category}"

Proporciona tu evaluación en formato JSON:`
      : `Evaluate this hackathon project:
Description: "${projectDescription}"
Kiro Usage: "${kiroUsage}"
Category: "${category}"

Provide your evaluation in JSON format:`;

    const jsonStructure = {
      score: isSpanish ? "puntuación del 0-100" : "score from 0-100",
      detailedSummary: isSpanish ? "resumen detallado de la evaluación" : "detailed summary of the evaluation",
      criteria: [
        {
          name: isSpanish ? "Innovación" : "Innovation",
          score: isSpanish ? "puntuación 0-100" : "score 0-100",
          justification: isSpanish ? "justificación" : "justification"
        },
        {
          name: isSpanish ? "Uso de Kiro" : "Kiro Usage",
          score: isSpanish ? "puntuación 0-100" : "score 0-100",
          justification: isSpanish ? "justificación" : "justification"
        },
        {
          name: isSpanish ? "Viabilidad" : "Feasibility",
          score: isSpanish ? "puntuación 0-100" : "score 0-100",
          justification: isSpanish ? "justificación" : "justification"
        }
      ],
      suggestions: [isSpanish ? "sugerencias de mejora" : "improvement suggestions"]
    };

    return [
      { parts: [{ text: systemPrompt }] },
      { parts: [{ text: `${analysisPrompt}\n\n\`\`\`json\n${JSON.stringify(jsonStructure, null, 2)}\n\`\`\`` }] }
    ];
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
      const isRetryable = error instanceof AIServiceError && 
        (error.code === 'TIMEOUT' || error.code === 'RATE_LIMIT' || error.code === 'UNKNOWN_ERROR');
      
      // If not retryable or last attempt, return the error
      if (!isRetryable || attempt === maxRetries) {
        return result;
      }
      
      lastError = error;
      
      // Exponential backoff: wait 1s, 2s, 4s
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // This should never be reached, but TypeScript needs it
    return failure(lastError || new Error('Unknown error during retry'));
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
      let jsonText = markdownMatch && markdownMatch[2] ? markdownMatch[2] : rawText;

      // Find JSON object boundaries
      const firstBrace = jsonText.indexOf('{');
      const lastBrace = jsonText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        jsonText = jsonText.substring(firstBrace, lastBrace + 1);
      }

      parsed = JSON.parse(jsonText);
    } catch (error) {
      throw new AIServiceError(
        'Failed to parse AI response',
        'PARSE_ERROR',
        error,
        'parse'
      );
    }
    
    // Type guard to check if parsed is an object
    if (typeof parsed !== 'object' || parsed === null) {
      throw new AIServiceError(
        'Invalid AI response format',
        'INVALID_FORMAT',
        null,
        'parse'
      );
    }

    const parsedObj = parsed as Record<string, unknown>;
    
    // Validate required fields
    if (!parsedObj.score || !parsedObj.detailedSummary || !parsedObj.criteria || !parsedObj.suggestions) {
      throw new AIServiceError(
        'Invalid AI response format',
        'INVALID_FORMAT',
        null,
        'parse'
      );
    }
    
    // Validate score value
    if (typeof parsedObj.score !== 'number' || parsedObj.score < 0 || parsedObj.score > 100) {
      throw new AIServiceError(
        'Invalid score value',
        'INVALID_SCORE',
        null,
        'parse'
      );
    }
    
    // Normalize and return the response
    return {
      score: parsedObj.score,
      detailedSummary: typeof parsedObj.detailedSummary === 'string' ? parsedObj.detailedSummary : '',
      criteria: Array.isArray(parsedObj.criteria) ? parsedObj.criteria.map((c: unknown) => {
        const criterion = c as Record<string, unknown>;
        return {
          name: typeof criterion.name === 'string' ? criterion.name : 'Unknown',
          score: typeof criterion.score === 'number' ? Math.max(0, Math.min(100, criterion.score)) : 0,
          justification: typeof criterion.justification === 'string' ? criterion.justification : ''
        };
      }) : [],
      suggestions: Array.isArray(parsedObj.suggestions) ? parsedObj.suggestions.filter(s => typeof s === 'string') : []
    };
  }

  /**
   * Create a configured GoogleAIAdapter instance
   */
  static create(apiKey?: string): GoogleAIAdapter {
    const key = apiKey || process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!key) {
      throw new Error(
        'GEMINI_API_KEY environment variable not set. Configure it in your environment or pass it directly.'
      );
    }

    return new GoogleAIAdapter({
      apiKey: key,
      timeout: 30000,
      maxRetries: 3,
    });
  }
}