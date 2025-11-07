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
    
    const languageInstruction = isSpanish
      ? "MUY IMPORTANTE: Tu respuesta completa, incluyendo todo el texto en los valores JSON, debe estar en español."
      : "VERY IMPORTANT: Your entire response, including all text in the JSON values, must be in English.";

    const categoryDescriptions: Record<string, string> = {
      resurrection: isSpanish 
        ? "Revivir tecnología obsoleta con innovaciones modernas"
        : "Reviving obsolete technology with modern innovations",
      frankenstein: isSpanish
        ? "Integración de tecnologías aparentemente incompatibles"
        : "Integration of seemingly incompatible technologies",
      "skeleton-crew": isSpanish
        ? "Base flexible con múltiples casos de uso"
        : "Flexible foundation with multiple use cases",
      "costume-contest": isSpanish
        ? "Pulido de UI y elementos de diseño espeluznantes"
        : "UI polish and spooky design elements",
    };

    const prompt = isSpanish ? `Eres un juez de hackathon de clase mundial y evaluador técnico especializado en la competencia Kiroween. Tu tarea es proporcionar un análisis completo de un proyecto de hackathon contra las categorías específicas de Kiroween y los criterios de evaluación.

${languageInstruction}

Tu respuesta completa DEBE ser un único objeto JSON válido que se ajuste a la estructura descrita a continuación. No incluyas ningún texto, markdown o sintaxis de bloque de código antes o después del objeto JSON.

PROYECTO ENVIADO:
Descripción: "${projectDescription}"
Categoría Seleccionada: "${category}" (${categoryDescriptions[category] || category})
Uso de Kiro: "${kiroUsage}"

CATEGORÍAS KIROWEEN:
1. Resurrection: Revivir tecnología obsoleta con innovaciones modernas
2. Frankenstein: Integración de tecnologías aparentemente incompatibles
3. Skeleton Crew: Base flexible con múltiples casos de uso
4. Costume Contest: Pulido de UI y elementos de diseño espeluznantes

CRITERIOS DE EVALUACIÓN (cada uno puntuado 1-5):
1. Valor Potencial: Singularidad del mercado, intuitividad de la UI, potencial de escalabilidad
2. Implementación: Variedad de características de Kiro utilizadas, profundidad de comprensión, integración estratégica
3. Calidad y Diseño: Creatividad, originalidad, pulido

Proporciona tu análisis en el siguiente formato JSON (todos los valores numéricos deben ser números, no strings):

{
  "categoryAnalysis": {
    "evaluations": [
      {
        "category": "resurrection",
        "fitScore": 7.5,
        "explanation": "Explicación detallada de qué tan bien encaja el proyecto en esta categoría",
        "improvementSuggestions": ["Sugerencia específica 1", "Sugerencia específica 2"]
      }
    ],
    "bestMatch": "resurrection",
    "bestMatchReason": "Explicación de por qué esta categoría es la mejor opción"
  },
  "criteriaAnalysis": {
    "scores": [
      {
        "name": "Potential Value",
        "score": 4.2,
        "justification": "Justificación detallada para esta puntuación",
        "subScores": {
          "Market Uniqueness": {
            "score": 4.0,
            "explanation": "Evaluación de la singularidad del mercado"
          },
          "UI Intuitiveness": {
            "score": 4.5,
            "explanation": "Evaluación de la intuitividad de la UI"
          },
          "Scalability": {
            "score": 4.0,
            "explanation": "Evaluación del potencial de escalabilidad"
          }
        }
      },
      {
        "name": "Implementation",
        "score": 3.8,
        "justification": "Justificación detallada para esta puntuación",
        "subScores": {
          "Kiro Features Variety": {
            "score": 4.0,
            "explanation": "Evaluación de la variedad de características de Kiro"
          },
          "Depth of Understanding": {
            "score": 3.5,
            "explanation": "Evaluación de la profundidad de comprensión"
          },
          "Strategic Integration": {
            "score": 4.0,
            "explanation": "Evaluación de la integración estratégica"
          }
        }
      },
      {
        "name": "Quality and Design",
        "score": 4.0,
        "justification": "Justificación detallada para esta puntuación",
        "subScores": {
          "Creativity": {
            "score": 4.2,
            "explanation": "Evaluación de la creatividad"
          },
          "Originality": {
            "score": 3.8,
            "explanation": "Evaluación de la originalidad"
          },
          "Polish": {
            "score": 4.0,
            "explanation": "Evaluación del pulido y calidad"
          }
        }
      }
    ],
    "finalScore": 4.0,
    "finalScoreExplanation": "Explicación del puntaje final"
  },
  "detailedSummary": "Análisis completo cubriendo el potencial del proyecto en el hackathon",
  "viabilitySummary": "Resumen breve de la viabilidad competitiva del proyecto",
  "competitors": [],
  "improvementSuggestions": [
    {
      "title": "Título de Mejora",
      "description": "Sugerencia específica y accionable"
    }
  ],
  "nextSteps": [
    {
      "title": "Título del Siguiente Paso",
      "description": "Paso específico y accionable"
    }
  ],
  "hackathonSpecificAdvice": {
    "categoryOptimization": ["Consejo específico para mejor alineación con la categoría"],
    "kiroIntegrationTips": ["Sugerencias para mejorar el uso de características de Kiro"],
    "competitionStrategy": ["Consejo para destacar en la competencia"]
  },
  "finalScore": 4.0,
  "finalScoreExplanation": "El puntaje final refleja el rendimiento en todos los criterios"
}` : `You are a world-class hackathon judge and technical evaluator specializing in the Kiroween competition. Your task is to provide a comprehensive analysis of a hackathon project submission against the specific Kiroween categories and judging criteria.

${languageInstruction}

Your entire response MUST be a single, valid JSON object that conforms to the structure described below. Do not include any text, markdown, or code block syntax before or after the JSON object.

PROJECT SUBMISSION:
Description: "${projectDescription}"
Selected Category: "${category}" (${categoryDescriptions[category] || category})
Kiro Usage: "${kiroUsage}"

KIROWEEN CATEGORIES:
1. Resurrection: Reviving obsolete technology with modern innovations
2. Frankenstein: Integration of seemingly incompatible technologies
3. Skeleton Crew: Flexible foundation with multiple use cases
4. Costume Contest: UI polish and spooky design elements

JUDGING CRITERIA (each scored 1-5):
1. Potential Value: Market uniqueness, UI intuitiveness, scalability potential
2. Implementation: Variety of Kiro features used, depth of understanding, strategic integration
3. Quality and Design: Creativity, originality, polish

Please provide your analysis in the following JSON format (all numeric values must be numbers, not strings):

{
  "categoryAnalysis": {
    "evaluations": [
      {
        "category": "resurrection",
        "fitScore": 7.5,
        "explanation": "Detailed explanation of how well the project fits this category",
        "improvementSuggestions": ["Specific suggestion 1", "Specific suggestion 2"]
      }
    ],
    "bestMatch": "resurrection",
    "bestMatchReason": "Explanation of why this category is the best fit"
  },
  "criteriaAnalysis": {
    "scores": [
      {
        "name": "Potential Value",
        "score": 4.2,
        "justification": "Detailed justification for this score",
        "subScores": {
          "Market Uniqueness": {
            "score": 4.0,
            "explanation": "Assessment of market uniqueness"
          },
          "UI Intuitiveness": {
            "score": 4.5,
            "explanation": "Assessment of UI intuitiveness"
          },
          "Scalability": {
            "score": 4.0,
            "explanation": "Assessment of scalability potential"
          }
        }
      },
      {
        "name": "Implementation",
        "score": 3.8,
        "justification": "Detailed justification for this score",
        "subScores": {
          "Kiro Features Variety": {
            "score": 4.0,
            "explanation": "Assessment of Kiro features variety"
          },
          "Depth of Understanding": {
            "score": 3.5,
            "explanation": "Assessment of understanding depth"
          },
          "Strategic Integration": {
            "score": 4.0,
            "explanation": "Assessment of strategic integration"
          }
        }
      },
      {
        "name": "Quality and Design",
        "score": 4.0,
        "justification": "Detailed justification for this score",
        "subScores": {
          "Creativity": {
            "score": 4.2,
            "explanation": "Assessment of creativity"
          },
          "Originality": {
            "score": 3.8,
            "explanation": "Assessment of originality"
          },
          "Polish": {
            "score": 4.0,
            "explanation": "Assessment of polish and quality"
          }
        }
      }
    ],
    "finalScore": 4.0,
    "finalScoreExplanation": "The final score reflects performance across all judging criteria"
  },
  "detailedSummary": "Comprehensive analysis covering the project's hackathon potential",
  "viabilitySummary": "Brief concluding summary of the project's competitive viability",
  "competitors": [],
  "improvementSuggestions": [
    {
      "title": "Enhancement Title",
      "description": "Specific actionable suggestion"
    }
  ],
  "nextSteps": [
    {
      "title": "Next Step Title",
      "description": "Specific actionable next step"
    }
  ],
  "hackathonSpecificAdvice": {
    "categoryOptimization": ["Specific advice for better aligning with the best-fit category"],
    "kiroIntegrationTips": ["Specific suggestions for improving Kiro feature utilization"],
    "competitionStrategy": ["Advice for standing out in the competition"]
  },
  "finalScore": 4.0,
  "finalScoreExplanation": "The final score reflects strong performance across all judging criteria"
}

EVALUATION GUIDELINES:
Category Fit Scoring (1-10 scale):
- 8-10: Excellent alignment with category theme and criteria
- 6-7: Good fit with clear category relevance
- 4-5: Moderate alignment, some category elements present
- 2-3: Limited alignment, weak category connection
- 1: Minimal or no alignment with category

Criteria Scoring (1-5 scale):
- 5: Exceptional - Industry-leading quality and innovation
- 4: Strong - Above-average with notable strengths
- 3: Good - Solid execution meeting expectations
- 2: Fair - Basic implementation with room for improvement
- 1: Poor - Significant weaknesses requiring major work

Focus on:
- How well the project leverages Kiro's unique capabilities
- Innovation and creativity within the hackathon context
- Technical feasibility and execution quality
- Competitive differentiation from similar projects
- Alignment with the selected Kiroween category
- Practical value and user impact potential
- Quality of implementation and attention to detail

Be constructive but honest in your evaluation, providing specific actionable feedback that can help improve the project within the hackathon timeline.`;

    return [
      { parts: [{ text: prompt }] }
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
    
    // Validate required fields - support both old and new formats
    const hasOldFormat = parsedObj.score && parsedObj.detailedSummary && parsedObj.criteria && parsedObj.suggestions;
    const hasNewFormat = parsedObj.categoryAnalysis && parsedObj.criteriaAnalysis && parsedObj.detailedSummary;
    
    if (!hasOldFormat && !hasNewFormat) {
      logger.error(LogCategory.AI, 'Invalid AI response format - missing required fields', {
        hasScore: !!parsedObj.score,
        hasDetailedSummary: !!parsedObj.detailedSummary,
        hasCriteria: !!parsedObj.criteria,
        hasSuggestions: !!parsedObj.suggestions,
        hasCategoryAnalysis: !!parsedObj.categoryAnalysis,
        hasCriteriaAnalysis: !!parsedObj.criteriaAnalysis,
        keys: Object.keys(parsedObj)
      });
      throw new AIServiceError(
        'Invalid AI response format - missing required fields',
        'INVALID_FORMAT',
        null,
        'parse'
      );
    }
    
    // Validate and normalize score value (for old format or as fallback)
    let score: number = 0;
    
    if (parsedObj.score !== undefined) {
      if (typeof parsedObj.score === 'number') {
        score = parsedObj.score;
      } else if (typeof parsedObj.score === 'string') {
        // Try to parse string as number
        score = parseFloat(parsedObj.score);
        if (isNaN(score)) {
          logger.error(LogCategory.AI, 'Score is not a valid number', {
            scoreValue: parsedObj.score,
            scoreType: typeof parsedObj.score
          });
          score = 0;
        }
      }
      
      // Validate score range
      if (score < 0 || score > 100) {
        logger.warn(LogCategory.AI, 'Score out of range, clamping', {
          originalScore: score,
          clampedScore: Math.max(0, Math.min(100, score))
        });
        score = Math.max(0, Math.min(100, score));
      }
    } else if (parsedObj.finalScore !== undefined) {
      // New format uses finalScore (0-5 scale)
      if (typeof parsedObj.finalScore === 'number') {
        score = parsedObj.finalScore * 20; // Convert 0-5 to 0-100
      }
    }
    
    // Normalize and return the response - return the full parsed object
    // This allows both old and new formats to work
    const baseResult = {
      score,
      detailedSummary: typeof parsedObj.detailedSummary === 'string' ? parsedObj.detailedSummary : '',
      criteria: Array.isArray(parsedObj.criteria) ? parsedObj.criteria.map((c: unknown) => {
        const criterion = c as Record<string, unknown>;
        
        // Parse criterion score (can be number or string)
        let criterionScore = 0;
        if (typeof criterion.score === 'number') {
          criterionScore = criterion.score;
        } else if (typeof criterion.score === 'string') {
          criterionScore = parseFloat(criterion.score);
          if (isNaN(criterionScore)) {
            criterionScore = 0;
          }
        }
        
        return {
          name: typeof criterion.name === 'string' ? criterion.name : 'Unknown',
          score: Math.max(0, Math.min(100, criterionScore)),
          justification: typeof criterion.justification === 'string' ? criterion.justification : ''
        };
      }) : [],
      suggestions: Array.isArray(parsedObj.suggestions) ? parsedObj.suggestions.filter(s => typeof s === 'string') : []
    };
    
    // Merge with any additional fields from the parsed object (for new format)
    return {
      ...baseResult,
      ...parsedObj
    } as AIAnalysisResult;
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