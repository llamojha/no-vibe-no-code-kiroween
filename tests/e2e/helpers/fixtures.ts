/**
 * Test fixtures and common test data
 * Provides predefined test data for consistent testing across E2E tests
 */

export const TEST_IDEAS = {
  simple: 'AI-powered task manager for remote teams',
  complex: 'A blockchain-based decentralized marketplace for digital art with NFT integration and smart contract automation',
  short: 'Food delivery app',
  multilingual: 'Aplicación de gestión de tareas con IA',
  innovative: 'A platform that connects local farmers with restaurants using AI-powered demand forecasting',
  technical: 'Real-time collaborative code editor with AI-powered code suggestions and debugging',
};

export const TEST_HACKATHON_PROJECTS = {
  basic: {
    name: 'Smart Task Manager',
    description: 'An AI-powered task management system that helps teams prioritize work',
    kiroUsage: 'Used Kiro to generate the initial project structure and implement core features',
  },
  advanced: {
    name: 'EcoTrack',
    description: 'A sustainability tracking platform that helps users monitor their carbon footprint',
    kiroUsage: 'Leveraged Kiro for rapid prototyping, code generation, and debugging throughout the hackathon',
  },
  minimal: {
    name: 'QuickNote',
    description: 'A simple note-taking app with markdown support',
    kiroUsage: 'Used Kiro for basic setup and configuration',
  },
  comprehensive: {
    name: 'HealthHub',
    description: 'A comprehensive health tracking platform with AI-powered insights, meal planning, and workout recommendations',
    kiroUsage: 'Extensively used Kiro for architecture design, code generation, testing, and deployment automation',
  },
};

export const TEST_FRANKENSTEIN_ELEMENTS = {
  companies: {
    twoElements: ['Netflix', 'Uber'],
    threeElements: ['Spotify', 'Airbnb', 'Tesla'],
    fourElements: ['Amazon', 'Google', 'Apple', 'Microsoft'],
    fiveElements: ['Netflix', 'Uber', 'Spotify', 'Airbnb', 'Tesla'],
  },
  aws: {
    twoElements: ['Lambda', 'DynamoDB'],
    threeElements: ['S3', 'EC2', 'CloudFront'],
    fourElements: ['API Gateway', 'Cognito', 'SQS', 'SNS'],
    fiveElements: ['Lambda', 'DynamoDB', 'S3', 'API Gateway', 'CloudFront'],
  },
};

export const TEST_LOCALES = {
  english: 'en' as const,
  spanish: 'es' as const,
};

export const TEST_TIMEOUTS = {
  short: 5000,
  medium: 10000,
  long: 30000,
  veryLong: 60000,
};

export const TEST_SELECTORS = {
  // Common selectors used across tests
  loadingSpinner: '[data-testid="loading-spinner"]',
  errorMessage: '[data-testid="error-message"]',
  successMessage: '[data-testid="success-message"]',
  resultsContainer: '[data-testid="results-container"]',
  analysisScore: '[data-testid="analysis-score"]',
  analysisSummary: '[data-testid="analysis-summary"]',
};

export const TEST_MOCK_SCENARIOS = {
  success: 'success' as const,
  apiError: 'api_error' as const,
  timeout: 'timeout' as const,
  rateLimit: 'rate_limit' as const,
};

export const TEST_ROUTES = {
  home: '/',
  analyzer: '/analyzer',
  hackathonAnalyzer: '/kiroween-analyzer',
  frankenstein: '/doctor-frankenstein',
  dashboard: '/dashboard',
  login: '/login',
};

export const TEST_API_ENDPOINTS = {
  analyze: '/api/analyze',
  analyzeHackathon: '/api/analyze-hackathon',
  generateFrankenstein: '/api/doctor-frankenstein/generate',
};

/**
 * Helper to get random element from array
 */
export function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Helper to get random test idea
 */
export function getRandomTestIdea(): string {
  const ideas = Object.values(TEST_IDEAS);
  return getRandomElement(ideas);
}

/**
 * Helper to get random test hackathon project
 */
export function getRandomTestHackathonProject(): typeof TEST_HACKATHON_PROJECTS.basic {
  const projects = Object.values(TEST_HACKATHON_PROJECTS);
  return getRandomElement(projects);
}

/**
 * Helper to get random Frankenstein elements
 */
export function getRandomFrankensteinElements(
  mode: 'companies' | 'aws',
  count: 2 | 3 | 4 | 5 = 3
): string[] {
  const elements = TEST_FRANKENSTEIN_ELEMENTS[mode];
  const key = `${count === 2 ? 'two' : count === 3 ? 'three' : count === 4 ? 'four' : 'five'}Elements` as keyof typeof elements;
  return elements[key];
}

/**
 * Test user credentials (for authentication tests)
 */
export const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  name: 'Test User',
};

/**
 * Expected response structure validators
 */
export const EXPECTED_RESPONSE_FIELDS = {
  analysis: ['score', 'summary', 'strengths', 'weaknesses', 'opportunities', 'threats'],
  hackathon: ['score', 'summary', 'categoryRecommendation', 'kiroUsageAnalysis'],
  frankenstein: ['idea_title', 'idea_description', 'core_concept', 'metrics'],
};
