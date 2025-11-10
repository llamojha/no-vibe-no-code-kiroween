/**
 * Utilities for resolving mock mode feature flags.
 *
 * Centralizes the logic that decides whether mock mode should be enabled
 * based on environment variables and runtime defaults.
 */

type ResolveOptions = {
  /**
   * When provided, overrides the fallback that is used when the environment
   * variable is not defined or cannot be parsed.
   */
  defaultValue?: boolean;
  /**
   * Allow enabling mock mode even when running in production.
   * Defaults to false to maintain the security posture that mock mode is
   * never active in production deployments.
   */
  allowInProduction?: boolean;
};

const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on', 'y', 't']);
const FALSE_VALUES = new Set(['0', 'false', 'no', 'off', 'n', 'f']);

function parseBooleanFlag(value?: string | null): boolean | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (TRUE_VALUES.has(normalized)) {
    return true;
  }
  if (FALSE_VALUES.has(normalized)) {
    return false;
  }

  return undefined;
}

export function getMockModeDefault(): boolean {
  const nodeEnv = process.env.NODE_ENV || 'development';
  return nodeEnv !== 'production';
}

/**
 * Resolves whether mock mode should be enabled given an environment variable.
 * Falls back to enabling mock mode whenever we're not running in production
 * and the flag is not explicitly set.
 */
export function resolveMockModeFlag(
  value?: string | null,
  options: ResolveOptions = {}
): boolean {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const allowInProduction = options.allowInProduction ?? false;

  if (nodeEnv === 'production' && !allowInProduction) {
    // Never allow implicit mock mode in production environments.
    return false;
  }

  const parsed = parseBooleanFlag(value);
  if (typeof parsed === 'boolean') {
    return parsed;
  }

  if (typeof options.defaultValue === 'boolean') {
    return options.defaultValue;
  }

  return getMockModeDefault();
}

/**
 * Convenience helper that checks whether the runtime should treat mock mode
 * as enabled using the server-side FF_USE_MOCK_API variable.
 */
export function isServerMockModeEnabled(): boolean {
  return resolveMockModeFlag(process.env.FF_USE_MOCK_API);
}

/**
 * Convenience helper that checks whether the browser/UI should treat mock mode
 * as enabled using the NEXT_PUBLIC_FF_USE_MOCK_API variable.
 */
export function isClientMockModeEnabled(): boolean {
  return resolveMockModeFlag(process.env.NEXT_PUBLIC_FF_USE_MOCK_API);
}
