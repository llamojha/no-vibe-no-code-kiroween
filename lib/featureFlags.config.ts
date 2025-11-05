// Central place to register feature flags for the app.
// Add your flags in the object passed to `registerFlags`.

import { registerFlags } from './featureFlags'

export function initFeatureFlags() {
  registerFlags({
    // Example (disabled by default):
    // NEW_CHECKOUT: defineBooleanFlag({
    //   key: 'NEW_CHECKOUT',
    //   description: 'Enable the new checkout flow',
    //   default: false,
    //   exposeToClient: true,
    // }),
  })
}
