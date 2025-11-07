import { GoogleAIAdapter } from './GoogleAIAdapter';
import { Locale } from '../../../domain/value-objects';
import { Result, success, failure } from '../../../shared/types/common';

/**
 * Configuration for transcription service
 */
export interface TranscriptionConfig {
  maxAudioSize?: number; // in bytes
  supportedMimeTypes?: string[];
  timeout?: number;
  confidenceThreshold?: number;
}

/**
 * Transcription result
 */
export interface TranscriptionResult {
  text: string;
  confidence?: number;
  language?: string;
  duration?: number;
  wordCount: number;
}

/**
 * Transcription service error
 */
export class TranscriptionError extends Error {
  constructor(
    message: string,
    public readonly originalError?: any,
    public readonly audioSize?: number,
    public readonly mimeType?: string
  ) {
    super(message);
    this.name = 'TranscriptionError';
  }
}

/**
 * Audio transcription adapter for audio features
 * Wraps Google AI transcription functionality with domain-specific interface
 */
export class TranscriptionAdapter {
  private readonly googleAI: GoogleAIAdapter;
  private readonly config: TranscriptionConfig;

  constructor(googleAI: GoogleAIAdapter, config: TranscriptionConfig = {}) {
    this.googleAI = googleAI;
    this.config = {
      maxAudioSize: 10 * 1024 * 1024, // 10MB default
      supportedMimeTypes: [
        'audio/wav',
        'audio/mp3',
        'audio/mpeg',
        'audio/mp4',
        'audio/m4a',
        'audio/webm',
        'audio/ogg'
      ],
      timeout: 60000, // 60 seconds
      confidenceThreshold: 0.7,
      ...config,
    };
  }

  /**
   * Transcribe audio to text
   */
  async transcribeAudio(
    base64Audio: string,
    mimeType: string,
    locale: Locale
  ): Promise<Result<TranscriptionResult, Error>> {
    try {
      // Validate input
      const validation = this.validateAudioInput(base64Audio, mimeType);
      if (!validation.success) {
        return failure(validation.error);
      }

      // Transcribe using Google AI
      const result = await this.googleAI.transcribeAudio(base64Audio, mimeType, locale);
      
      if (!result.success) {
        return failure(new TranscriptionError(
          'Failed to transcribe audio',
          result.error,
          this.estimateAudioSize(base64Audio),
          mimeType
        ));
      }

      const transcriptionResult: TranscriptionResult = {
        text: result.data,
        confidence: this.estimateConfidence(result.data),
        language: locale.value,
        duration: this.estimateAudioDuration(base64Audio),
        wordCount: this.countWords(result.data),
      };

      return success(transcriptionResult);
    } catch (error) {
      return failure(new TranscriptionError(
        'Unexpected error during audio transcription',
        error,
        this.estimateAudioSize(base64Audio),
        mimeType
      ));
    }
  }

  /**
   * Transcribe audio for idea analysis
   */
  async transcribeIdeaAudio(
    base64Audio: string,
    mimeType: string,
    locale: Locale
  ): Promise<Result<TranscriptionResult, Error>> {
    try {
      const result = await this.transcribeAudio(base64Audio, mimeType, locale);
      
      if (!result.success) {
        return result;
      }

      // Post-process for idea analysis
      const processedText = this.postProcessIdeaTranscription(result.data.text, locale);
      
      return success({
        ...result.data,
        text: processedText,
      });
    } catch (error) {
      return failure(new TranscriptionError(
        'Failed to transcribe idea audio',
        error
      ));
    }
  }

  /**
   * Batch transcribe multiple audio files
   */
  async transcribeMultipleAudios(
    audios: Array<{ audio: string; mimeType: string; id: string }>,
    locale: Locale
  ): Promise<Result<Array<{ id: string; result: TranscriptionResult }>, Error>> {
    try {
      const results: Array<{ id: string; result: TranscriptionResult }> = [];
      
      for (const { audio, mimeType, id } of audios) {
        const transcriptionResult = await this.transcribeAudio(audio, mimeType, locale);
        
        if (transcriptionResult.success) {
          results.push({ id, result: transcriptionResult.data });
        } else {
          // Log error but continue with other audios
          console.error(`Transcription failed for audio ${id}:`, transcriptionResult.error);
        }
      }

      return success(results);
    } catch (error) {
      return failure(new TranscriptionError(
        'Failed to transcribe multiple audios',
        error
      ));
    }
  }

  /**
   * Validate audio input
   */
  validateAudioInput(base64Audio: string, mimeType: string): Result<void, Error> {
    // Check if audio data is provided
    if (!base64Audio || base64Audio.trim().length === 0) {
      return failure(new TranscriptionError('Audio data cannot be empty'));
    }

    // Check MIME type
    if (!this.config.supportedMimeTypes?.includes(mimeType)) {
      return failure(new TranscriptionError(
        `Unsupported audio format: ${mimeType}. Supported formats: ${this.config.supportedMimeTypes?.join(', ')}`,
        null,
        undefined,
        mimeType
      ));
    }

    // Check audio size
    const audioSize = this.estimateAudioSize(base64Audio);
    if (audioSize > (this.config.maxAudioSize || 10 * 1024 * 1024)) {
      return failure(new TranscriptionError(
        `Audio file too large: ${Math.round(audioSize / 1024 / 1024)}MB. Maximum size: ${Math.round((this.config.maxAudioSize || 10 * 1024 * 1024) / 1024 / 1024)}MB`,
        null,
        audioSize,
        mimeType
      ));
    }

    return success(undefined);
  }

  /**
   * Check if transcription quality is acceptable
   */
  isTranscriptionQualityAcceptable(result: TranscriptionResult): boolean {
    // Check minimum word count
    if (result.wordCount < 3) {
      return false;
    }

    // Check confidence if available
    if (result.confidence && result.confidence < (this.config.confidenceThreshold || 0.7)) {
      return false;
    }

    // Check for gibberish or repeated characters
    if (this.containsGibberish(result.text)) {
      return false;
    }

    return true;
  }

  /**
   * Get transcription configuration
   */
  getConfig(): TranscriptionConfig {
    return { ...this.config };
  }

  /**
   * Update transcription configuration
   */
  updateConfig(newConfig: Partial<TranscriptionConfig>): void {
    Object.assign(this.config, newConfig);
  }

  /**
   * Get supported audio formats
   */
  getSupportedFormats(): string[] {
    return [...(this.config.supportedMimeTypes || [])];
  }

  /**
   * Estimate audio file size from base64 data
   */
  private estimateAudioSize(base64Audio: string): number {
    // Base64 encoding increases size by ~33%, so actual size is ~75% of base64 length
    return Math.round(base64Audio.length * 0.75);
  }

  /**
   * Estimate audio duration (rough approximation)
   */
  private estimateAudioDuration(base64Audio: string): number {
    // Very rough estimate based on file size
    // Assumes average bitrate of 128kbps for compressed audio
    const sizeInBytes = this.estimateAudioSize(base64Audio);
    const averageBitrate = 128 * 1000 / 8; // 128kbps in bytes per second
    return Math.round(sizeInBytes / averageBitrate);
  }

  /**
   * Count words in transcribed text
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Estimate transcription confidence based on text characteristics
   */
  private estimateConfidence(text: string): number {
    let confidence = 1.0;

    // Reduce confidence for very short text
    if (text.length < 10) {
      confidence -= 0.3;
    }

    // Reduce confidence for text with many special characters
    const specialCharRatio = (text.match(/[^a-zA-Z0-9\s.,!?;:'"()-]/g) || []).length / text.length;
    confidence -= specialCharRatio * 0.5;

    // Reduce confidence for text with repeated patterns
    if (this.hasRepeatedPatterns(text)) {
      confidence -= 0.2;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Post-process transcription for idea analysis
   */
  private postProcessIdeaTranscription(text: string, locale: Locale): string {
    let processed = text.trim();

    // Remove common transcription artifacts
    processed = processed
      .replace(/\b(um|uh|er|ah)\b/gi, '') // Remove filler words
      .replace(/\s{2,}/g, ' ') // Normalize spaces
      .replace(/([.!?])\s*([a-z])/g, '$1 $2') // Fix sentence spacing
      .trim();

    // Capitalize first letter
    if (processed.length > 0) {
      processed = processed.charAt(0).toUpperCase() + processed.slice(1);
    }

    // Ensure it ends with punctuation
    if (processed.length > 0 && !/[.!?]$/.test(processed)) {
      processed += '.';
    }

    return processed;
  }

  /**
   * Check if text contains gibberish or nonsensical content
   */
  private containsGibberish(text: string): boolean {
    // Check for excessive repeated characters
    if (/(.)\1{5,}/.test(text)) {
      return true;
    }

    // Check for very high ratio of consonants to vowels
    const consonants = (text.match(/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]/g) || []).length;
    const vowels = (text.match(/[aeiouAEIOU]/g) || []).length;
    if (vowels > 0 && consonants / vowels > 8) {
      return true;
    }

    return false;
  }

  /**
   * Check for repeated patterns in text
   */
  private hasRepeatedPatterns(text: string): boolean {
    const words = text.toLowerCase().split(/\s+/);
    const wordCounts: Record<string, number> = {};
    
    for (const word of words) {
      if (word.length > 2) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    }

    // Check if any word appears more than 30% of the time
    const totalWords = words.length;
    for (const count of Object.values(wordCounts)) {
      if (count / totalWords > 0.3) {
        return true;
      }
    }

    return false;
  }

  /**
   * Create a configured TranscriptionAdapter instance
   */
  static create(googleAI?: GoogleAIAdapter, config?: TranscriptionConfig): TranscriptionAdapter {
    const aiAdapter = googleAI || GoogleAIAdapter.create();
    return new TranscriptionAdapter(aiAdapter, config);
  }
}