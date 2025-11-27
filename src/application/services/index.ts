/**
 * Application services exports
 */

// AI Analysis Service
export type {
  IAIAnalysisService,
  AIAnalysisResult,
} from "./IAIAnalysisService";
export { GoogleAIAnalysisService } from "./GoogleAIAnalysisService";
export type { GoogleAIConfig } from "./GoogleAIAnalysisService";

// Audio Processing Service
export type {
  IAudioProcessingService,
  TranscriptionResult,
  TextToSpeechResult,
  AudioProcessingOptions,
} from "./IAudioProcessingService";
export { AudioProcessingService } from "./AudioProcessingService";
export type { AudioProcessingConfig } from "./AudioProcessingService";

// Notification Service
export type {
  INotificationService,
  NotificationData,
  NotificationResult,
  NotificationAnalytics,
  NotificationType,
  NotificationChannel,
  NotificationPriority,
} from "./INotificationService";
export { NotificationService } from "./NotificationService";
export type { NotificationConfig } from "./NotificationService";

// Document Validator Service (Kiro Setup Export)
export { DocumentValidator } from "./DocumentValidator";
export type {
  ExportDocumentType,
  DocumentInput,
  DocumentsToValidate,
  DocumentValidationResult,
} from "./DocumentValidator";
