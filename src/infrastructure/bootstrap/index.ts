/**
 * Bootstrap utilities exports
 * Application initialization and startup utilities
 */

export {
  NextJSBootstrap,
  withApplicationBootstrap,
  withServerActionBootstrap,
  handleHealthCheck,
  createAPIRouteHandler,
  getControllers,
  devUtils,
} from './nextjs';

export {
  performStartupValidation,
  generateValidationReport,
  isValidationPassed,
  type ValidationResult,
  type StartupChecks,
} from './validation';