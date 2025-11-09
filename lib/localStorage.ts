/**
 * Local Storage Service for Development Mode
 *
 * Provides CRUD operations for browser local storage with proper error handling,
 * quota management, and namespace prefixing to avoid storage conflicts.
 */

import {
  SavedAnalysisRecord,
  SavedHackathonAnalysis,
  SavedFrankensteinIdea,
  UnifiedAnalysisRecord,
} from "./types";

// Namespace prefix to avoid conflicts with other applications
const STORAGE_PREFIX = "nvnc-local-";

// Storage keys
const STORAGE_KEYS = {
  ANALYSES: `${STORAGE_PREFIX}analyses`,
  HACKATHON_ANALYSES: `${STORAGE_PREFIX}hackathon-analyses`,
  FRANKENSTEIN_IDEAS: `${STORAGE_PREFIX}frankenstein-ideas`,
  USER: `${STORAGE_PREFIX}user`,
} as const;

// Error types for better error handling
export class LocalStorageError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = "LocalStorageError";
  }
}

export class StorageQuotaError extends LocalStorageError {
  constructor(message: string = "Local storage quota exceeded") {
    super(message);
    this.name = "StorageQuotaError";
  }
}

export class StorageCorruptionError extends LocalStorageError {
  constructor(message: string = "Local storage data is corrupted") {
    super(message);
    this.name = "StorageCorruptionError";
  }
}

/**
 * Local Storage Service for managing analysis data in development mode
 */
export class LocalStorageService {
  private static instance: LocalStorageService | null = null;

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance of LocalStorageService
   */
  public static getInstance(): LocalStorageService {
    if (!LocalStorageService.instance) {
      LocalStorageService.instance = new LocalStorageService();
    }
    return LocalStorageService.instance;
  }

  /**
   * Check if localStorage is available
   */
  private isLocalStorageAvailable(): boolean {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return false;
      }

      // Test localStorage functionality
      const testKey = `${STORAGE_PREFIX}test`;
      localStorage.setItem(testKey, "test");
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Safely parse JSON data from localStorage
   */
  private safeParseJSON<T>(data: string | null, fallback: T): T {
    if (!data) return fallback;

    try {
      return JSON.parse(data) as T;
    } catch (error) {
      console.warn("Failed to parse localStorage data:", error);
      throw new StorageCorruptionError("Failed to parse stored data");
    }
  }

  /**
   * Safely set data to localStorage with quota handling
   */
  private safeSetItem(key: string, value: string): void {
    if (!this.isLocalStorageAvailable()) {
      throw new LocalStorageError("Local storage is not available");
    }

    try {
      localStorage.setItem(key, value);
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "QuotaExceededError"
      ) {
        throw new StorageQuotaError("Local storage quota exceeded");
      }
      throw new LocalStorageError(
        "Failed to save data to local storage",
        error as Error
      );
    }
  }

  /**
   * Get estimated storage usage in bytes
   */
  public getStorageUsage(): number {
    if (!this.isLocalStorageAvailable()) return 0;

    let totalSize = 0;
    for (const key of Object.values(STORAGE_KEYS)) {
      const data = localStorage.getItem(key);
      if (data) {
        totalSize += new Blob([data]).size;
      }
    }
    return totalSize;
  }

  /**
   * Check if storage is approaching quota limits (>80% of estimated 5MB)
   */
  public isStorageNearQuota(): boolean {
    const usage = this.getStorageUsage();
    const estimatedQuota = 5 * 1024 * 1024; // 5MB estimated quota
    return usage > estimatedQuota * 0.8;
  }

  // CRUD Operations for Startup Idea Analyses

  /**
   * Save a startup idea analysis to local storage
   */
  public async saveAnalysis(analysis: SavedAnalysisRecord): Promise<void> {
    try {
      const existingAnalyses = await this.loadAnalyses();

      // Check if analysis already exists and update it, otherwise add new
      const existingIndex = existingAnalyses.findIndex(
        (a) => a.id === analysis.id
      );
      if (existingIndex >= 0) {
        existingAnalyses[existingIndex] = analysis;
      } else {
        existingAnalyses.push(analysis);
      }

      const serializedData = JSON.stringify(existingAnalyses);
      this.safeSetItem(STORAGE_KEYS.ANALYSES, serializedData);
    } catch (error) {
      if (error instanceof LocalStorageError) {
        throw error;
      }
      throw new LocalStorageError("Failed to save analysis", error as Error);
    }
  }

  /**
   * Load all startup idea analyses from local storage
   */
  public async loadAnalyses(): Promise<SavedAnalysisRecord[]> {
    try {
      if (!this.isLocalStorageAvailable()) {
        return [];
      }

      const data = localStorage.getItem(STORAGE_KEYS.ANALYSES);
      return this.safeParseJSON(data, []);
    } catch (error) {
      if (error instanceof StorageCorruptionError) {
        // Clear corrupted data and return empty array
        console.warn("Clearing corrupted analysis data");
        localStorage.removeItem(STORAGE_KEYS.ANALYSES);
        return [];
      }
      throw error;
    }
  }

  /**
   * Get a specific startup idea analysis by ID
   */
  public async getAnalysis(id: string): Promise<SavedAnalysisRecord | null> {
    const analyses = await this.loadAnalyses();
    return analyses.find((a) => a.id === id) || null;
  }

  /**
   * Delete a startup idea analysis by ID
   */
  public async deleteAnalysis(id: string): Promise<boolean> {
    try {
      const analyses = await this.loadAnalyses();
      const filteredAnalyses = analyses.filter((a) => a.id !== id);

      if (filteredAnalyses.length === analyses.length) {
        return false; // Analysis not found
      }

      const serializedData = JSON.stringify(filteredAnalyses);
      this.safeSetItem(STORAGE_KEYS.ANALYSES, serializedData);
      return true;
    } catch (error) {
      throw new LocalStorageError("Failed to delete analysis", error as Error);
    }
  }

  // CRUD Operations for Doctor Frankenstein Ideas

  /**
   * Save a Doctor Frankenstein idea to local storage
   */
  public async saveFrankensteinIdea(
    idea: SavedFrankensteinIdea
  ): Promise<void> {
    try {
      const existingIdeas = await this.loadFrankensteinIdeas();

      // Check if idea already exists and update it, otherwise add new
      const existingIndex = existingIdeas.findIndex((i) => i.id === idea.id);
      if (existingIndex >= 0) {
        existingIdeas[existingIndex] = idea;
      } else {
        existingIdeas.push(idea);
      }

      // Limit to 50 ideas to prevent storage bloat
      const limitedIdeas = existingIdeas.slice(0, 50);

      const serializedData = JSON.stringify(limitedIdeas);
      this.safeSetItem(STORAGE_KEYS.FRANKENSTEIN_IDEAS, serializedData);
    } catch (error) {
      if (error instanceof LocalStorageError) {
        throw error;
      }
      throw new LocalStorageError(
        "Failed to save Frankenstein idea",
        error as Error
      );
    }
  }

  /**
   * Load all Doctor Frankenstein ideas from local storage
   */
  public async loadFrankensteinIdeas(): Promise<SavedFrankensteinIdea[]> {
    try {
      if (!this.isLocalStorageAvailable()) {
        return [];
      }

      const data = localStorage.getItem(STORAGE_KEYS.FRANKENSTEIN_IDEAS);
      const ideas = this.safeParseJSON<SavedFrankensteinIdea[]>(data, []);
      
      // Sort by createdAt descending (newest first)
      return ideas.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } catch (error) {
      if (error instanceof StorageCorruptionError) {
        // Clear corrupted data and return empty array
        console.warn("Clearing corrupted Frankenstein idea data");
        localStorage.removeItem(STORAGE_KEYS.FRANKENSTEIN_IDEAS);
        return [];
      }
      throw error;
    }
  }

  /**
   * Get a specific Doctor Frankenstein idea by ID
   */
  public async getFrankensteinIdea(
    id: string
  ): Promise<SavedFrankensteinIdea | null> {
    const ideas = await this.loadFrankensteinIdeas();
    return ideas.find((i) => i.id === id) || null;
  }

  /**
   * Delete a Doctor Frankenstein idea by ID
   */
  public async deleteFrankensteinIdea(id: string): Promise<boolean> {
    try {
      const ideas = await this.loadFrankensteinIdeas();
      const filteredIdeas = ideas.filter((i) => i.id !== id);

      if (filteredIdeas.length === ideas.length) {
        return false; // Idea not found
      }

      const serializedData = JSON.stringify(filteredIdeas);
      this.safeSetItem(STORAGE_KEYS.FRANKENSTEIN_IDEAS, serializedData);
      return true;
    } catch (error) {
      throw new LocalStorageError(
        "Failed to delete Frankenstein idea",
        error as Error
      );
    }
  }

  // CRUD Operations for Hackathon Analyses

  /**
   * Save a hackathon analysis to local storage
   */
  public async saveHackathonAnalysis(
    analysis: SavedHackathonAnalysis
  ): Promise<void> {
    try {
      const existingAnalyses = await this.loadHackathonAnalyses();

      // Check if analysis already exists and update it, otherwise add new
      const existingIndex = existingAnalyses.findIndex(
        (a) => a.id === analysis.id
      );
      if (existingIndex >= 0) {
        existingAnalyses[existingIndex] = analysis;
      } else {
        existingAnalyses.push(analysis);
      }

      const serializedData = JSON.stringify(existingAnalyses);
      this.safeSetItem(STORAGE_KEYS.HACKATHON_ANALYSES, serializedData);
    } catch (error) {
      if (error instanceof LocalStorageError) {
        throw error;
      }
      throw new LocalStorageError(
        "Failed to save hackathon analysis",
        error as Error
      );
    }
  }

  /**
   * Load all hackathon analyses from local storage
   */
  public async loadHackathonAnalyses(): Promise<SavedHackathonAnalysis[]> {
    try {
      if (!this.isLocalStorageAvailable()) {
        return [];
      }

      const data = localStorage.getItem(STORAGE_KEYS.HACKATHON_ANALYSES);
      return this.safeParseJSON(data, []);
    } catch (error) {
      if (error instanceof StorageCorruptionError) {
        // Clear corrupted data and return empty array
        console.warn("Clearing corrupted hackathon analysis data");
        localStorage.removeItem(STORAGE_KEYS.HACKATHON_ANALYSES);
        return [];
      }
      throw error;
    }
  }

  /**
   * Get a specific hackathon analysis by ID
   */
  public async getHackathonAnalysis(
    id: string
  ): Promise<SavedHackathonAnalysis | null> {
    const analyses = await this.loadHackathonAnalyses();
    return analyses.find((a) => a.id === id) || null;
  }

  /**
   * Delete a hackathon analysis by ID
   */
  public async deleteHackathonAnalysis(id: string): Promise<boolean> {
    try {
      const analyses = await this.loadHackathonAnalyses();
      const filteredAnalyses = analyses.filter((a) => a.id !== id);

      if (filteredAnalyses.length === analyses.length) {
        return false; // Analysis not found
      }

      const serializedData = JSON.stringify(filteredAnalyses);
      this.safeSetItem(STORAGE_KEYS.HACKATHON_ANALYSES, serializedData);
      return true;
    } catch (error) {
      throw new LocalStorageError(
        "Failed to delete hackathon analysis",
        error as Error
      );
    }
  }

  // Unified Operations

  /**
   * Load all analyses (both startup ideas and hackathon) as unified records
   */
  public async loadUnifiedAnalyses(): Promise<UnifiedAnalysisRecord[]> {
    try {
      const [startupAnalyses, hackathonAnalyses] = await Promise.all([
        this.loadAnalyses(),
        this.loadHackathonAnalyses(),
      ]);

      const unifiedRecords: UnifiedAnalysisRecord[] = [];

      // Convert startup analyses
      for (const analysis of startupAnalyses) {
        unifiedRecords.push({
          id: analysis.id,
          userId: analysis.userId,
          category: "idea",
          title: analysis.idea,
          createdAt: analysis.createdAt,
          finalScore: analysis.analysis.finalScore,
          summary: analysis.analysis.detailedSummary,
          audioBase64: analysis.audioBase64,
          originalData: analysis,
        });
      }

      // Convert hackathon analyses
      for (const analysis of hackathonAnalyses) {
        unifiedRecords.push({
          id: analysis.id,
          userId: analysis.userId,
          category: "kiroween",
          title: analysis.projectDescription,
          createdAt: analysis.createdAt,
          finalScore: analysis.analysis.finalScore,
          summary: analysis.analysis.detailedSummary,
          audioBase64: analysis.audioBase64,
          originalData: analysis,
        });
      }

      // Sort by creation date (newest first)
      return unifiedRecords.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      throw new LocalStorageError(
        "Failed to load unified analyses",
        error as Error
      );
    }
  }

  // Utility Operations

  /**
   * Clear all stored analysis data
   */
  public async clearAllAnalyses(): Promise<void> {
    try {
      if (!this.isLocalStorageAvailable()) {
        return;
      }

      localStorage.removeItem(STORAGE_KEYS.ANALYSES);
      localStorage.removeItem(STORAGE_KEYS.HACKATHON_ANALYSES);
      localStorage.removeItem(STORAGE_KEYS.FRANKENSTEIN_IDEAS);
    } catch (error) {
      throw new LocalStorageError(
        "Failed to clear analysis data",
        error as Error
      );
    }
  }

  /**
   * Get storage statistics
   */
  public getStorageStats(): {
    isAvailable: boolean;
    usageBytes: number;
    nearQuota: boolean;
    analysisCount: number;
    hackathonAnalysisCount: number;
    frankensteinIdeaCount: number;
  } {
    const isAvailable = this.isLocalStorageAvailable();

    if (!isAvailable) {
      return {
        isAvailable: false,
        usageBytes: 0,
        nearQuota: false,
        analysisCount: 0,
        hackathonAnalysisCount: 0,
        frankensteinIdeaCount: 0,
      };
    }

    const analysisData = localStorage.getItem(STORAGE_KEYS.ANALYSES);
    const hackathonData = localStorage.getItem(STORAGE_KEYS.HACKATHON_ANALYSES);
    const frankensteinData = localStorage.getItem(
      STORAGE_KEYS.FRANKENSTEIN_IDEAS
    );

    const analysisCount = analysisData
      ? this.safeParseJSON(analysisData, []).length
      : 0;
    const hackathonAnalysisCount = hackathonData
      ? this.safeParseJSON(hackathonData, []).length
      : 0;
    const frankensteinIdeaCount = frankensteinData
      ? this.safeParseJSON(frankensteinData, []).length
      : 0;

    return {
      isAvailable: true,
      usageBytes: this.getStorageUsage(),
      nearQuota: this.isStorageNearQuota(),
      analysisCount,
      hackathonAnalysisCount,
      frankensteinIdeaCount,
    };
  }
}

// Export singleton instance for easy access
export const localStorageService = LocalStorageService.getInstance();
