// Central place to register feature flags for the app.
// Add your flags in the object passed to `registerFlags`.

import { registerFlags, defineBooleanFlag } from "./featureFlags";
import { resolveMockModeFlag } from "./testing/config/mock-mode-flags";

const TRUTHY = new Set(["1", "true", "yes", "on", "y", "t"]);

function resolveBooleanEnvFlag(value?: string | null): boolean | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (TRUTHY.has(normalized)) return true;
  if (["0", "false", "no", "off", "n", "f"].includes(normalized)) return false;
  return undefined;
}

export function initFeatureFlags() {
  registerFlags({
    ENABLE_CLASSIC_ANALYZER: defineBooleanFlag({
      key: "ENABLE_CLASSIC_ANALYZER",
      description: "Show the classic startup idea analyzer button on home page",
      default: true,
      exposeToClient: true,
    }),
    ENABLE_KIROWEEN_ANALYZER: defineBooleanFlag({
      key: "ENABLE_KIROWEEN_ANALYZER",
      description: "Show the Kiroween hackathon analyzer button on home page",
      default: true,
      exposeToClient: true,
    }),
    LOCAL_DEV_MODE: defineBooleanFlag({
      key: "LOCAL_DEV_MODE",
      description:
        "Local development mode (derives from NODE_ENV === 'development')",
      default:
        resolveBooleanEnvFlag(process.env.FF_LOCAL_DEV_MODE) ??
        resolveBooleanEnvFlag(process.env.NEXT_PUBLIC_FF_LOCAL_DEV_MODE) ??
        (process.env.NODE_ENV || "development") === "development",
      exposeToClient: false,
    }),
    ENABLE_SHARE_LINKS: defineBooleanFlag({
      key: "ENABLE_SHARE_LINKS",
      description: "Enable share link buttons and functionality",
      default: false,
      exposeToClient: true,
    }),
    USE_MOCK_API: defineBooleanFlag({
      key: "USE_MOCK_API",
      description:
        "Enable mock API mode for testing (never enabled in production)",
      default: resolveMockModeFlag(process.env.FF_USE_MOCK_API, {
        allowInProduction: false,
      }),
      exposeToClient: false,
    }),
    CREDIT_SYSTEM: defineBooleanFlag({
      key: "CREDIT_SYSTEM",
      description: "Enable credit-based rate limiting system",
      default: process.env.FF_CREDIT_SYSTEM?.toLowerCase() !== "false",
      exposeToClient: false,
    }),
    ENABLE_IDEA_PANEL: defineBooleanFlag({
      key: "ENABLE_IDEA_PANEL",
      description: "Enable Idea Panel feature for managing ideas and documents",
      default: resolveBooleanEnvFlag(process.env.FF_ENABLE_IDEA_PANEL) ?? false,
      exposeToClient: true,
    }),
  });
}
