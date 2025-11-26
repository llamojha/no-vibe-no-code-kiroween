/**
 * Resolve a mock-mode flag value from environment/config.
 */
export function resolveMockModeFlag(
  value?: string | boolean | null,
  options?: { default?: boolean; allowInProduction?: boolean }
): boolean {
  if (value === true) return true;
  if (value === false) return false;
  if (typeof value === "string") {
    return value.toLowerCase() === "true" || value === "1";
  }
  return options?.default ?? false;
}

export function isServerMockModeEnabled(): boolean {
  return resolveMockModeFlag(process.env.FF_USE_MOCK_API, { default: true });
}
