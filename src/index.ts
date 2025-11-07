/**
 * Main entry point for the hexagonal architecture layers
 * This file provides convenient access to all layers of the application
 */

// Main application bootstrap
export {
  Application,
  initializeApplication,
  getApplication,
  getServiceFactory,
  healthCheck,
} from './main';

// Domain layer exports
export * from './domain';

// Application layer exports  
export * from './application';

// Infrastructure layer exports
export * from './infrastructure';

// Shared utilities and types
export * from './shared';