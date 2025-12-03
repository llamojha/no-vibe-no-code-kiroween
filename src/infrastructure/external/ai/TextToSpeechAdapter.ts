import { GoogleAIAdapter } from './GoogleAIAdapter';
import { Locale } from '../../../domain/value-objects';
import { Result, success, failure } from '../../../shared/types/common';

/**
 * Configuration for Text-to-Speech service
 */
export interface TTSConfig {
  maxTextLength?: number;
  voiceName?: string;
  timeout?: number;
}

/**
 * Text-to-Speech result
 */
export interface TTSResult {
  audioBase64: string;
  mimeType: string;
  duration?: number;
}

/**
 * Text-to-Speech service error
 */
export class TTSError extends Error {
  constructor(
    message: string,
    public readonly originalError?: unknown,
    public readonly textLength?: number
  ) {
    super(message);
    this.name = 'TTSError';
  }
}

/**
 * Text-to-Speech adapter for audio features
 * Wraps Google AI TTS functionality with domain-specific interface
 */
export class TextToSpeechAdapter {
  private readonly googleAI: GoogleAIAdapter;
  private readonly config: TTSConfig;

  constructor(googleAI: GoogleAIAdapter, config: TTSConfig = {}) {
    this.googleAI = googleAI;
    this.config = {
      maxTextLength: 15000,
      voiceName: 'Kore',
      timeout: 30000,
      ...config,
    };
  }

  /**
   * Convert text to speech audio
   */
  async convertTextToSpeech(text: string, locale: Locale): Promise<Result<TTSResult, Error>> {
    try {
      // Validate input
      if (!text || text.trim().length === 0) {
        return failure(new TTSError('Text cannot be empty'));
      }

      if (text.length > (this.config.maxTextLength || 15000)) {
        return failure(new TTSError(
          `Text too long. Maximum length is ${this.config.maxTextLength} characters.`,
          null,
          text.length
        ));
      }

      // Generate speech using Google AI
      const result = await this.googleAI.generateSpeech(text, locale);
      
      if (!result.success) {
        return failure(new TTSError(
          'Failed to generate speech',
          result.error
        ));
      }

      return success({
        audioBase64: result.data,
        mimeType: 'audio/wav', // Google AI typically returns WAV format
        duration: this.estimateAudioDuration(text),
      });
    } catch (error) {
      return failure(new TTSError(
        'Unexpected error during text-to-speech conversion',
        error
      ));
    }
  }

  /**
   * Convert analysis feedback to speech
   */
  async convertAnalysisFeedbackToSpeech(
    feedback: string,
    locale: Locale
  ): Promise<Result<TTSResult, Error>> {
    try {
      // Prepare feedback text for TTS
      const preparedText = this.prepareFeedbackForTTS(feedback, locale);
      
      return await this.convertTextToSpeech(preparedText, locale);
    } catch (error) {
      return failure(new TTSError(
        'Failed to convert analysis feedback to speech',
        error
      ));
    }
  }

  /**
   * Convert analysis summary to speech
   */
  async convertAnalysisSummaryToSpeech(
    summary: string,
    score: number,
    locale: Locale
  ): Promise<Result<TTSResult, Error>> {
    try {
      const preparedText = this.prepareSummaryForTTS(summary, score, locale);
      
      return await this.convertTextToSpeech(preparedText, locale);
    } catch (error) {
      return failure(new TTSError(
        'Failed to convert analysis summary to speech',
        error
      ));
    }
  }

  /**
   * Batch convert multiple texts to speech
   */
  async convertMultipleTextsToSpeech(
    texts: Array<{ text: string; id: string }>,
    locale: Locale
  ): Promise<Result<Array<{ id: string; result: TTSResult }>, Error>> {
    try {
      const results: Array<{ id: string; result: TTSResult }> = [];
      
      for (const { text, id } of texts) {
        const ttsResult = await this.convertTextToSpeech(text, locale);
        
        if (ttsResult.success) {
          results.push({ id, result: ttsResult.data });
        } else {
          // Log error but continue with other texts
          console.error(`TTS failed for text ${id}:`, ttsResult.error);
        }
      }

      return success(results);
    } catch (error) {
      return failure(new TTSError(
        'Failed to convert multiple texts to speech',
        error
      ));
    }
  }

  /**
   * Check if text is suitable for TTS
   */
  validateTextForTTS(text: string): Result<void, Error> {
    if (!text || text.trim().length === 0) {
      return failure(new TTSError('Text cannot be empty'));
    }

    if (text.length > (this.config.maxTextLength || 15000)) {
      return failure(new TTSError(
        `Text too long. Maximum length is ${this.config.maxTextLength} characters.`,
        null,
        text.length
      ));
    }

    // Check for potentially problematic content
    if (this.containsProblematicContent(text)) {
      return failure(new TTSError('Text contains content that may not be suitable for TTS'));
    }

    return success(undefined);
  }

  /**
   * Get TTS configuration
   */
  getConfig(): TTSConfig {
    return { ...this.config };
  }

  /**
   * Update TTS configuration
   */
  updateConfig(newConfig: Partial<TTSConfig>): void {
    Object.assign(this.config, newConfig);
  }

  /**
   * Prepare feedback text for TTS by cleaning and formatting
   */
  private prepareFeedbackForTTS(feedback: string, locale: Locale): string {
    const isSpanish = locale.value === 'es';
    
    // Add introduction
    const intro = isSpanish
      ? 'Aquí está el análisis de tu idea:'
      : 'Here is the analysis of your idea:';
    
    // Clean up the feedback text
    let cleanedFeedback = feedback
      .replace(/\*\*/g, '') // Remove markdown bold
      .replace(/\*/g, '') // Remove markdown italic
      .replace(/#{1,6}\s/g, '') // Remove markdown headers
      .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
      .trim();

    // Truncate if too long
    const maxLength = (this.config.maxTextLength || 15000) - intro.length - 50;
    if (cleanedFeedback.length > maxLength) {
      cleanedFeedback = cleanedFeedback.substring(0, maxLength) + '...';
    }

    return `${intro}\n\n${cleanedFeedback}`;
  }

  /**
   * Prepare summary with score for TTS
   */
  private prepareSummaryForTTS(summary: string, score: number, locale: Locale): string {
    const isSpanish = locale.value === 'es';
    
    const scoreIntro = isSpanish
      ? `Tu idea ha recibido una puntuación de ${score} sobre 100.`
      : `Your idea has received a score of ${score} out of 100.`;
    
    // Clean up the summary
    let cleanedSummary = summary
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .trim();

    // Truncate if needed
    const maxLength = (this.config.maxTextLength || 15000) - scoreIntro.length - 50;
    if (cleanedSummary.length > maxLength) {
      cleanedSummary = cleanedSummary.substring(0, maxLength) + '...';
    }

    return `${scoreIntro}\n\n${cleanedSummary}`;
  }

  /**
   * Estimate audio duration based on text length
   */
  private estimateAudioDuration(text: string): number {
    // Rough estimate: average speaking rate is about 150-160 words per minute
    const words = text.split(/\s+/).length;
    const wordsPerMinute = 155;
    const durationMinutes = words / wordsPerMinute;
    return Math.ceil(durationMinutes * 60); // Return duration in seconds
  }

  /**
   * Check if text contains potentially problematic content for TTS
   */
  private containsProblematicContent(text: string): boolean {
    // Check for excessive special characters that might cause TTS issues
    const specialCharRatio = (text.match(/[^a-zA-Z0-9\s.,!?;:'"()-]/g) || []).length / text.length;
    if (specialCharRatio > 0.1) { // More than 10% special characters
      return true;
    }

    // Check for very long words that might cause issues
    const words = text.split(/\s+/);
    const hasVeryLongWords = words.some(word => word.length > 50);
    if (hasVeryLongWords) {
      return true;
    }

    return false;
  }

  /**
   * Create a configured TextToSpeechAdapter instance
   */
  static create(googleAI?: GoogleAIAdapter, config?: TTSConfig): TextToSpeechAdapter {
    const aiAdapter = googleAI || GoogleAIAdapter.create();
    return new TextToSpeechAdapter(aiAdapter, config);
  }
}