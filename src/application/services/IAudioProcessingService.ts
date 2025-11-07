import { Locale } from '../../domain/value-objects';
import { Result } from '../../shared/types/common';

/**
 * Audio transcription result
 */
export interface TranscriptionResult {
  text: string;
  confidence: number;
  language: string;
  duration: number;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
    confidence: number;
  }>;
}

/**
 * Text-to-speech result
 */
export interface TextToSpeechResult {
  audioUrl: string;
  duration: number;
  format: 'mp3' | 'wav' | 'ogg';
  size: number;
}

/**
 * Audio processing options
 */
export interface AudioProcessingOptions {
  quality?: 'low' | 'medium' | 'high';
  speed?: number; // 0.5 to 2.0
  voice?: 'male' | 'female' | 'neutral';
  format?: 'mp3' | 'wav' | 'ogg';
}

/**
 * Interface for audio processing service
 * Handles text-to-speech and speech-to-text operations
 */
export interface IAudioProcessingService {
  /**
   * Convert text to speech
   */
  textToSpeech(
    text: string,
    locale: Locale,
    options?: AudioProcessingOptions
  ): Promise<Result<TextToSpeechResult, Error>>;

  /**
   * Convert speech to text
   */
  speechToText(
    audioData: Buffer | string,
    locale?: Locale,
    options?: AudioProcessingOptions
  ): Promise<Result<TranscriptionResult, Error>>;

  /**
   * Get supported languages for TTS
   */
  getSupportedTTSLanguages(): Promise<Result<Array<{
    code: string;
    name: string;
    voices: Array<{
      name: string;
      gender: 'male' | 'female' | 'neutral';
      quality: 'standard' | 'premium';
    }>;
  }>, Error>>;

  /**
   * Get supported languages for STT
   */
  getSupportedSTTLanguages(): Promise<Result<Array<{
    code: string;
    name: string;
    accuracy: number;
  }>, Error>>;

  /**
   * Check service health and availability
   */
  healthCheck(): Promise<Result<{
    ttsStatus: 'healthy' | 'degraded' | 'unhealthy';
    sttStatus: 'healthy' | 'degraded' | 'unhealthy';
    latency: number;
  }, Error>>;
}