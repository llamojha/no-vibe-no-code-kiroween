/**
 * localStorage repositories for Open Source Mode
 * Provides data persistence using browser localStorage when LOCAL_STORAGE_MODE is enabled
 */

// Adapter and utilities
export {
  LocalStorageAdapter,
  STORAGE_KEYS,
  StorageQuotaError,
  StorageCorruptionError,
  LocalStorageError,
  type StorageKey,
  type Identifiable,
} from "./LocalStorageAdapter";

// Repository implementations
export { LocalStorageAnalysisRepository, type StoredAnalysis } from "./LocalStorageAnalysisRepository";
export { LocalStorageUserRepository, type StoredUser } from "./LocalStorageUserRepository";
export { LocalStorageIdeaRepository, type StoredIdea } from "./LocalStorageIdeaRepository";
export { LocalStorageDocumentRepository, type StoredDocument } from "./LocalStorageDocumentRepository";
export { LocalStorageCreditTransactionRepository, type StoredCreditTransaction } from "./LocalStorageCreditTransactionRepository";
