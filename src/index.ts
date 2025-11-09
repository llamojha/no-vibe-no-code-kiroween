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

// Infrastructure layer exports (selective to avoid conflicts)
export { 
  NextJSBootstrap, 
  withApplicationBootstrap, 
  withServerActionBootstrap, 
  handleHealthCheck, 
  getControllers 
} from './infrastructure/bootstrap';
export * from './infrastructure/config';
// Export only safe database pieces to avoid name conflicts with domain types
export { SupabaseClient } from './infrastructure/database/supabase/SupabaseClient';
export * from './infrastructure/database/errors';
export * from './infrastructure/factories';
// Note: Excluding other infrastructure modules to avoid export conflicts

// Shared utilities and types
export * from './shared';
