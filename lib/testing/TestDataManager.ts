/**
 * Test Data Manager for Mock Services
 * 
 * Manages predefined mock responses and test scenarios for testing automation.
 * Provides response caching, scenario-based selection, and variant support.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import type { TestScenario, MockResponse, CacheStats } from './types';
import {
  AnalyzerMockResponseSchema,
  HackathonMockResponseSchema,
  FrankensteinMockResponseSchema,
} from './schemas';
import { ZodError, type ZodIssue } from 'zod';

/**
 * Type for mock response data
 */
export type MockResponseType = 'analyzer' | 'hackathon' | 'frankenstein';

/**
 * Mock data structure for each response type
 */
export interface MockDataFile<T = unknown> {
  scenarios: {
    [key in TestScenario]?: MockResponse<T>[];
  };
}

/**
 * Validation result for mock responses
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * TestDataManager handles loading, caching, and selection of mock responses
 */
export class TestDataManager {
  private cache: Map<string, MockResponse> = new Map();
  private dataCache: Map<MockResponseType, MockDataFile> = new Map();
  private readonly dataDir: string;
  
  // Cache statistics
  private cacheHits = 0;
  private cacheMisses = 0;
  
  // Cache TTL (time-to-live) in milliseconds
  private readonly cacheTTL: number;
  private cacheTimestamps: Map<string, number> = new Map();

  constructor(dataDir?: string, cacheTTL?: number) {
    // Default to lib/testing/data directory
    this.dataDir = dataDir || join(process.cwd(), 'lib', 'testing', 'data');
    // Default cache TTL: 5 minutes (0 = no expiration)
    this.cacheTTL = cacheTTL ?? 0;
  }

  /**
   * Get mock response for a specific scenario
   * @param type - Response type (analyzer, hackathon, frankenstein)
   * @param scenario - Test scenario to use
   * @returns Mock response for the scenario
   */
  getMockResponse<T = unknown>(
    type: MockResponseType,
    scenario: TestScenario
  ): MockResponse<T> {
    const cacheKey = `${type}:${scenario}`;

    // Check cache first and validate TTL
    if (this.isCacheValid(cacheKey)) {
      this.cacheHits++;
      return this.cache.get(cacheKey) as MockResponse<T>;
    }

    // Cache miss
    this.cacheMisses++;

    // Load data file if not cached
    const dataFile = this.loadDataFile<T>(type);

    // Get responses for scenario
    const responses = dataFile.scenarios[scenario];
    if (!responses || responses.length === 0) {
      const availableScenarios = Object.keys(dataFile.scenarios).join(', ');
      throw new Error(
        `No mock responses found for type "${type}" and scenario "${scenario}". ` +
        `Available scenarios: ${availableScenarios || 'none'}`
      );
    }

    // Use first response by default
    const response = responses[0];

    // Cache the response with timestamp
    this.setCacheEntry(cacheKey, response);

    return response;
  }

  /**
   * Get random response variant for a type
   * @param type - Response type
   * @param scenario - Test scenario (defaults to 'success')
   * @returns Random mock response variant
   */
  getRandomVariant<T = unknown>(
    type: MockResponseType,
    scenario: TestScenario = 'success'
  ): MockResponse<T> {
    const dataFile = this.loadDataFile<T>(type);
    const responses = dataFile.scenarios[scenario];

    if (!responses || responses.length === 0) {
      const availableScenarios = Object.keys(dataFile.scenarios).join(', ');
      throw new Error(
        `No mock response variants found for type "${type}" and scenario "${scenario}". ` +
        `Available scenarios: ${availableScenarios || 'none'}`
      );
    }

    // Select random variant
    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex];
  }

  /**
   * Load mock data file for a specific type
   * @private
   */
  private loadDataFile<T = unknown>(type: MockResponseType): MockDataFile<T> {
    // Check if already loaded
    if (this.dataCache.has(type)) {
      return this.dataCache.get(type) as MockDataFile<T>;
    }

    // Determine file path
    const fileName = this.getFileName(type);
    const filePath = join(this.dataDir, fileName);

    try {
      // Read and parse JSON file
      const fileContent = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent) as MockDataFile<T>;

      // Validate responses on load
      this.validateOnLoad(type, data);

      // Cache the data
      this.dataCache.set(type, data);

      return data;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(
          `Mock data file not found: ${filePath}. Please ensure mock data files are created.`
        );
      }
      throw new Error(
        `Failed to load mock data file for type "${type}": ${(error as Error).message}`
      );
    }
  }

  /**
   * Get file name for a response type
   * @private
   */
  private getFileName(type: MockResponseType): string {
    switch (type) {
      case 'analyzer':
        return 'analyzer-mocks.json';
      case 'hackathon':
        return 'hackathon-mocks.json';
      case 'frankenstein':
        return 'frankenstein-mocks.json';
      default:
        throw new Error(`Unknown mock response type: ${type}`);
    }
  }

  /**
   * Validate mock response against Zod schema
   * @param response - Mock response to validate
   * @param type - Response type for validation
   * @returns Validation result with detailed errors
   */
  validateMockResponse(
    response: MockResponse,
    type: MockResponseType
  ): ValidationResult {
    try {
      // Select appropriate schema based on type
      const schema = this.getSchemaForType(type);
      
      // Validate using Zod schema
      schema.parse(response);
      
      return {
        valid: true,
        errors: [],
        warnings: [],
      };
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors into readable messages
        const errors = error.issues.map((err: ZodIssue) => {
          const path = err.path.join('.');
          return `${path}: ${err.message}`;
        });
        
        return {
          valid: false,
          errors,
          warnings: [],
        };
      }
      
      // Handle unexpected errors
      return {
        valid: false,
        errors: [`Validation failed: ${(error as Error).message}`],
        warnings: [],
      };
    }
  }

  /**
   * Get Zod schema for a specific response type
   * @private
   */
  private getSchemaForType(type: MockResponseType) {
    switch (type) {
      case 'analyzer':
        return AnalyzerMockResponseSchema;
      case 'hackathon':
        return HackathonMockResponseSchema;
      case 'frankenstein':
        return FrankensteinMockResponseSchema;
      default:
        throw new Error(`Unknown mock response type: ${type}`);
    }
  }

  /**
   * Validate all responses in a data file
   * @param type - Response type to validate
   * @returns Array of validation results for each scenario
   */
  validateAllResponses(type: MockResponseType): Map<string, ValidationResult[]> {
    const dataFile = this.loadDataFile(type);
    const results = new Map<string, ValidationResult[]>();

    for (const [scenario, responses] of Object.entries(dataFile.scenarios)) {
      if (!responses) continue;

      const scenarioResults: ValidationResult[] = [];
      
      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        const validationResult = this.validateMockResponse(response, type);
        
        // Add context about which variant failed
        if (!validationResult.valid) {
          validationResult.errors = validationResult.errors.map(
            (error) => `Variant ${i + 1}: ${error}`
          );
        }
        
        scenarioResults.push(validationResult);
      }
      
      results.set(scenario, scenarioResults);
    }

    return results;
  }

  /**
   * Validate responses on load (called automatically when loading data files)
   * @param type - Response type
   * @param data - Data file to validate
   * @throws Error if validation fails and strict mode is enabled
   */
  private validateOnLoad(type: MockResponseType, data: MockDataFile): void {
    // Only validate in development or test environments
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    const strictMode = process.env.FF_STRICT_MOCK_VALIDATION === 'true';
    const allErrors: string[] = [];

    for (const [scenario, responses] of Object.entries(data.scenarios)) {
      if (!responses) continue;

      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        const result = this.validateMockResponse(response, type);

        if (!result.valid) {
          const errorPrefix = `[${type}/${scenario}/variant-${i + 1}]`;
          allErrors.push(...result.errors.map((err) => `${errorPrefix} ${err}`));
        }
      }
    }

    if (allErrors.length > 0) {
      const errorMessage = `Mock data validation failed for ${type}:\n${allErrors.join('\n')}`;
      
      if (strictMode) {
        throw new Error(errorMessage);
      } else {
        // Log warnings in non-strict mode
        console.warn(errorMessage);
      }
    }
  }

  /**
   * Load custom test data from a file path
   * @param filePath - Path to custom test data file
   */
  async loadCustomTestData(filePath: string): Promise<void> {
    try {
      const fileContent = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);

      // Determine type from file name or structure
      const fileName = filePath.split('/').pop() || '';
      let type: MockResponseType;

      if (fileName.includes('analyzer') && !fileName.includes('hackathon')) {
        type = 'analyzer';
      } else if (fileName.includes('hackathon')) {
        type = 'hackathon';
      } else if (fileName.includes('frankenstein')) {
        type = 'frankenstein';
      } else {
        throw new Error(
          `Cannot determine mock response type from file name "${fileName}". ` +
          `File name must include "analyzer", "hackathon", or "frankenstein".`
        );
      }

      // Cache the custom data
      this.dataCache.set(type, data);

      // Clear related cache entries
      this.clearCacheForType(type);
    } catch (error) {
      throw new Error(
        `Failed to load custom test data: ${(error as Error).message}`
      );
    }
  }

  /**
   * Clear cache for a specific response type
   * @private
   */
  private clearCacheForType(type: MockResponseType): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.startsWith(`${type}:`)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
  }

  /**
   * Check if cache entry is valid (not expired)
   * 
   * Validates that a cache entry exists and hasn't exceeded its TTL.
   * If TTL is 0, cache entries never expire.
   * 
   * @private
   * @param cacheKey - The cache key to check
   * @returns True if the cache entry is valid, false otherwise
   */
  private isCacheValid(cacheKey: string): boolean {
    if (!this.cache.has(cacheKey)) {
      return false;
    }

    // If no TTL is set, cache never expires
    if (this.cacheTTL === 0) {
      return true;
    }

    const timestamp = this.cacheTimestamps.get(cacheKey);
    if (!timestamp) {
      return false;
    }

    const age = Date.now() - timestamp;
    return age < this.cacheTTL;
  }

  /**
   * Set cache entry with timestamp
   * 
   * Stores a mock response in the cache along with the current timestamp
   * for TTL validation.
   * 
   * @private
   * @param cacheKey - The cache key to use
   * @param response - The mock response to cache
   */
  private setCacheEntry(cacheKey: string, response: MockResponse): void {
    this.cache.set(cacheKey, response);
    this.cacheTimestamps.set(cacheKey, Date.now());
  }

  /**
   * Invalidate cache entries older than TTL
   * 
   * Removes all cache entries that have exceeded their time-to-live.
   * This is useful for periodic cache cleanup.
   * 
   * @returns Number of cache entries that were invalidated
   */
  invalidateExpiredCache(): number {
    if (this.cacheTTL === 0) {
      return 0;
    }

    let invalidatedCount = 0;
    const now = Date.now();

    for (const [key, timestamp] of this.cacheTimestamps.entries()) {
      const age = now - timestamp;
      if (age >= this.cacheTTL) {
        this.cache.delete(key);
        this.cacheTimestamps.delete(key);
        invalidatedCount++;
      }
    }

    return invalidatedCount;
  }

  /**
   * Clear all caches
   * 
   * Removes all cached responses and data files, and resets cache statistics.
   * Useful for testing or when you need to force reload of mock data.
   */
  clearCache(): void {
    this.cache.clear();
    this.dataCache.clear();
    this.cacheTimestamps.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  /**
   * Get cache statistics including hit rate
   */
  getCacheStats(): CacheStats & {
    responsesCached: number;
    dataFilesCached: number;
  } {
    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRate = totalRequests > 0 ? (this.cacheHits / totalRequests) * 100 : 0;

    return {
      responsesCached: this.cache.size,
      dataFilesCached: this.dataCache.size,
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: Math.round(hitRate * 100) / 100, // Round to 2 decimal places
    };
  }

  /**
   * Reset cache statistics
   * 
   * Resets hit/miss counters to zero without clearing the actual cache.
   * Useful for starting fresh measurements.
   */
  resetCacheStats(): void {
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  /**
   * Customize mock response based on input parameters
   * @param response - Base mock response to customize
   * @param type - Response type
   * @param customization - Customization options
   * @returns Customized mock response
   */
  customizeMockResponse<T = unknown>(
    response: MockResponse<T>,
    type: MockResponseType,
    customization: MockResponseCustomization
  ): MockResponse<T> {
    // Deep clone the response to avoid mutating cached data
    const customized = JSON.parse(JSON.stringify(response)) as MockResponse<T>;

    // Apply locale-specific customization
    if (customization.locale) {
      customized.data = this.applyLocaleCustomization(
        customized.data,
        type,
        customization.locale
      );
    }

    // Apply input-based customization
    if (customization.input) {
      customized.data = this.applyInputCustomization(
        customized.data,
        type,
        customization.input
      );
    }

    // Merge with variant data if provided
    if (customization.variantData) {
      customized.data = this.mergeResponseData(
        customized.data,
        customization.variantData
      );
    }

    return customized;
  }

  /**
   * Apply locale-specific customization to response data
   * @private
   */
  private applyLocaleCustomization<T = unknown>(
    data: T,
    type: MockResponseType,
    locale: string
  ): T {
    // For error responses, return as-is
    if (typeof data === 'object' && data !== null && 'error' in data) {
      return data;
    }

    // Apply locale-specific text transformations
    if (locale === 'es') {
      return this.translateToSpanish(data, type);
    }

    return data;
  }

  /**
   * Translate response data to Spanish
   * @private
   */
  private translateToSpanish<T = unknown>(data: T, type: MockResponseType): T {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const translated = { ...data } as Record<string, unknown>;

    // Common translations
    const translations: Record<string, string> = {
      'detailedSummary': 'Este concepto muestra un fuerte potencial en el mercado.',
      'viabilitySummary': 'Viable con ejecución enfocada.',
      'finalScoreExplanation': 'Esta idea muestra un buen potencial con algunos riesgos de ejecución.',
    };

    // Apply translations for known fields
    for (const [key, value] of Object.entries(translated)) {
      if (typeof value === 'string' && translations[key]) {
        translated[key] = translations[key];
      }
    }

    // For Frankenstein responses, update language field
    if (type === 'frankenstein' && 'language' in translated) {
      translated.language = 'es';
    }

    return translated as T;
  }

  /**
   * Apply input-based customization to response data
   * @private
   */
  private applyInputCustomization<T = unknown>(
    data: T,
    type: MockResponseType,
    input: Record<string, unknown>
  ): T {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const customized = { ...data } as Record<string, unknown>;

    switch (type) {
      case 'analyzer':
        return this.customizeAnalyzerResponse(customized, input) as T;
      case 'hackathon':
        return this.customizeHackathonResponse(customized, input) as T;
      case 'frankenstein':
        return this.customizeFrankensteinResponse(customized, input) as T;
      default:
        return data;
    }
  }

  /**
   * Customize analyzer response based on input
   * @private
   */
  private customizeAnalyzerResponse(
    data: Record<string, unknown>,
    input: Record<string, unknown>
  ): Record<string, unknown> {
    // If idea text is provided, incorporate it into the summary
    if (input.idea && typeof input.idea === 'string') {
      const ideaSnippet = input.idea.substring(0, 50);
      if (data.detailedSummary && typeof data.detailedSummary === 'string') {
        data.detailedSummary = data.detailedSummary.replace(
          /This .* concept/,
          `This "${ideaSnippet}..." concept`
        );
      }
    }

    return data;
  }

  /**
   * Customize hackathon response based on input
   * @private
   */
  private customizeHackathonResponse(
    data: Record<string, unknown>,
    input: Record<string, unknown>
  ): Record<string, unknown> {
    // If project description is provided, incorporate it
    if (input.projectDescription && typeof input.projectDescription === 'string') {
      const descSnippet = input.projectDescription.substring(0, 50);
      if (data.detailedSummary && typeof data.detailedSummary === 'string') {
        data.detailedSummary = `This "${descSnippet}..." project ${data.detailedSummary.substring(5)}`;
      }
    }

    return data;
  }

  /**
   * Customize Frankenstein response based on input
   * @private
   */
  private customizeFrankensteinResponse(
    data: Record<string, unknown>,
    input: Record<string, unknown>
  ): Record<string, unknown> {
    // Parse input elements and incorporate into response
    if (input.elements && Array.isArray(input.elements)) {
      const elements = input.elements as Array<{ name?: string; description?: string }>;
      const elementNames = elements
        .map((el) => el.name)
        .filter(Boolean)
        .join(' + ');

      // Update title to include element names
      if (elementNames && data.idea_title && typeof data.idea_title === 'string') {
        // Create a more dynamic title based on element count
        const titleSuffix = elements.length === 2 
          ? 'Fusion Platform' 
          : elements.length === 3 
          ? 'Integration Hub' 
          : 'Ecosystem';
        data.idea_title = `${elementNames} ${titleSuffix}`;
      }

      // Incorporate element descriptions into idea description
      if (data.idea_description && typeof data.idea_description === 'string') {
        const elementDescriptions = elements
          .filter(el => el.description)
          .map(el => el.name)
          .join(', ');
        
        if (elementDescriptions) {
          data.idea_description = data.idea_description.replace(
            /combines/i,
            `combines ${elementDescriptions} to create`
          );
        }
      }

      // Adjust metrics based on element count
      if (data.metrics && typeof data.metrics === 'object') {
        const metrics = data.metrics as Record<string, number>;
        const elementCount = elements.length;

        // More elements = higher originality but potentially lower feasibility
        if (elementCount === 2) {
          // Two elements: balanced scores
          metrics.originality_score = Math.min(100, metrics.originality_score + 5);
          metrics.feasibility_score = Math.min(100, metrics.feasibility_score + 5);
        } else if (elementCount === 3) {
          // Three elements: higher originality, slightly lower feasibility
          metrics.originality_score = Math.min(100, metrics.originality_score + 10);
          metrics.feasibility_score = Math.max(50, metrics.feasibility_score - 3);
        } else if (elementCount > 3) {
          // Many elements: very high originality, lower feasibility
          metrics.originality_score = Math.min(100, metrics.originality_score + 15);
          metrics.feasibility_score = Math.max(40, metrics.feasibility_score - 8);
          metrics.wow_factor = Math.min(100, metrics.wow_factor + 10);
        }
      }
    }

    // Customize tech stack suggestions based on mode
    if (input.mode === 'aws') {
      // AWS mode should emphasize infrastructure and scalability
      if (data.tech_stack_suggestion && typeof data.tech_stack_suggestion === 'string') {
        // Replace generic tech stack with AWS-specific suggestions
        let techStack = data.tech_stack_suggestion
          .replace(/Frontend built with React/i, 'Frontend using AWS Amplify with React')
          .replace(/Backend using Node\.js/i, 'Backend using AWS Lambda with Node.js')
          .replace(/PostgreSQL/i, 'Amazon RDS (PostgreSQL) or DynamoDB')
          .replace(/Redis/i, 'Amazon ElastiCache')
          .replace(/Cloud infrastructure on AWS/i, 'AWS-native architecture leveraging')
          .replace(/infrastructure/i, 'AWS infrastructure');
        
        // If no replacements were made, prepend AWS context
        if (!techStack.includes('AWS')) {
          techStack = `AWS-native architecture: ${techStack}`;
        }
        
        data.tech_stack_suggestion = techStack;
      }

      // Boost scalability and infrastructure-related metrics for AWS mode
      if (data.metrics && typeof data.metrics === 'object') {
        const metrics = data.metrics as Record<string, number>;
        metrics.scalability_score = Math.min(100, metrics.scalability_score + 12);
        metrics.feasibility_score = Math.min(100, metrics.feasibility_score + 5);
      }

      // Update growth strategy to emphasize cloud scalability
      if (data.growth_strategy && typeof data.growth_strategy === 'string') {
        if (!data.growth_strategy.includes('cloud') && !data.growth_strategy.includes('AWS')) {
          data.growth_strategy = `Leverage AWS global infrastructure for rapid scaling. ${data.growth_strategy}`;
        }
      }
    } else if (input.mode === 'companies') {
      // Companies mode should emphasize product synergy and user experience
      if (data.unique_value_proposition && typeof data.unique_value_proposition === 'string') {
        // Emphasize the synergy between companies
        if (input.elements && Array.isArray(input.elements) && input.elements.length >= 2) {
          const firstTwo = input.elements.slice(0, 2).map((el: { name?: string }) => el.name).filter(Boolean);
          if (firstTwo.length === 2) {
            data.unique_value_proposition = `Combines the best of ${firstTwo[0]} and ${firstTwo[1]}: ${data.unique_value_proposition}`;
          }
        }
      }

      // Boost impact and wow factor for companies mode
      if (data.metrics && typeof data.metrics === 'object') {
        const metrics = data.metrics as Record<string, number>;
        metrics.impact_score = Math.min(100, metrics.impact_score + 8);
        metrics.wow_factor = Math.min(100, metrics.wow_factor + 5);
      }
    }

    return data;
  }

  /**
   * Merge response data with variant data
   * @private
   */
  private mergeResponseData<T = unknown>(
    baseData: T,
    variantData: Record<string, unknown>
  ): T {
    if (typeof baseData !== 'object' || baseData === null) {
      return baseData;
    }

    if (typeof variantData !== 'object' || variantData === null) {
      return baseData;
    }

    // Deep merge objects
    const merged = { ...baseData };

    for (const [key, value] of Object.entries(variantData)) {
      if (value !== undefined) {
        if (
          typeof value === 'object' &&
          value !== null &&
          !Array.isArray(value) &&
          key in merged &&
          typeof merged[key as keyof T] === 'object'
        ) {
          // Recursively merge nested objects
          (merged as Record<string, unknown>)[key] = this.mergeResponseData(
            merged[key as keyof T],
            value as Record<string, unknown>
          );
        } else {
          // Direct assignment for primitives and arrays
          (merged as Record<string, unknown>)[key] = value;
        }
      }
    }

    return merged;
  }
}

/**
 * Customization options for mock responses
 */
export interface MockResponseCustomization {
  /** Locale for language-specific customization */
  locale?: string;
  /** Input data to incorporate into response */
  input?: Record<string, unknown>;
  /** Variant data to merge with base response */
  variantData?: Record<string, unknown>;
}

// Singleton instance for application-wide use
let instance: TestDataManager | null = null;

/**
 * Get the singleton TestDataManager instance
 */
export function getTestDataManager(): TestDataManager {
  if (!instance) {
    instance = new TestDataManager();
  }
  return instance;
}

/**
 * Reset the singleton instance (for testing purposes only)
 */
export function resetTestDataManager(): void {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot reset test data manager in production mode');
  }
  instance = null;
}
