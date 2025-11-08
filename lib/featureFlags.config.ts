// Central place to register feature flags for the app.
// Add your flags in the object passed to `registerFlags`.

import { registerFlags, defineBooleanFlag } from "./featureFlags";

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
      default: (process.env.NODE_ENV || "development") === "development",
      exposeToClient: false,
    }),
    ENABLE_SHARE_LINKS: defineBooleanFlag({
      key: "ENABLE_SHARE_LINKS",
      description: "Enable share link buttons and functionality",
      default: false,
      exposeToClient: true,
    }),
  });
}
