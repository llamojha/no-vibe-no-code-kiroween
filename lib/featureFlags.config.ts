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
        "Enable local development mode with mock auth and local storage",
      default: false,
      exposeToClient: false,
    }),
  });
}
