import { GoogleGenAI, Modality } from '@google/genai';
import { Locale } from '../../../domain/value-objects';
import { Result, success, failure } from '../../../shared/types/common';

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
    public readonly originalError?: any,
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
    try {
      const prompt = this.buildAnalysisPrompt(idea, locale);
      
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
        return failure(new AIServiceError('Empty response from Gemini AI', null, 'analyze'));
      }

      const analysisResult = this.parseAnalysisResponse(rawText);
      return success(analysisResult);
    } catch (error) {
      return failure(new AIServiceError(
        'Failed to analyze idea with Google AI',
        error,
        'analyze'
      ));
    }
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
        return failure(new AIServiceError('Empty response from Gemini AI', null, 'analyzeHackathon'));
      }

      const analysisResult = this.parseAnalysisResponse(rawText);
      return success(analysisResult);
    } catch (error) {
      return failure(new AIServiceError(
        'Failed to analyze hackathon project with Google AI',
        error,
        'analyzeHackathon'
      ));
    }
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
        return failure(new AIServiceError('Audio generation returned no data', null, 'tts'));
      }

      return success(base64Audio);
    } catch (error) {
      return failure(new AIServiceError(
        'Failed to generate speech with Google AI',
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
        return failure(new AIServiceError('Transcription returned no text', null, 'transcribe'));
      }

      return success(transcription);
    } catch (error) {
      return failure(new AIServiceError(
        'Failed to transcribe audio with Google AI',
        error,
        'transcribe'
      ));
    }
  }

  /**
   * Build analysis prompt for startup ideas
   */
  private buildAnalysisPrompt(idea: string, locale: Locale): any {
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
  ): any {
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
   * Parse AI response and extract analysis result
   */
  private parseAnalysisResponse(rawText: string): AIAnalysisResult {
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

      const parsed = JSON.parse(jsonText);
      
      // Validate and normalize the response
      return {
        score: typeof parsed.score === 'number' ? Math.max(0, Math.min(100, parsed.score)) : 0,
        detailedSummary: typeof parsed.detailedSummary === 'string' ? parsed.detailedSummary : '',
        criteria: Array.isArray(parsed.criteria) ? parsed.criteria.map(c => ({
          name: typeof c.name === 'string' ? c.name : 'Unknown',
          score: typeof c.score === 'number' ? Math.max(0, Math.min(100, c.score)) : 0,
          justification: typeof c.justification === 'string' ? c.justification : ''
        })) : [],
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.filter(s => typeof s === 'string') : []
      };
    } catch (error) {
      throw new AIServiceError(
        "Failed to parse AI response. The model returned an invalid format.",
        error,
        'parse'
      );
    }
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