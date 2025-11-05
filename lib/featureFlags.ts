// Centralized feature flag system
// Flags are configured via environment variables:
// - Server-only:  FF_<FLAG_NAME>
// - Exposed to client: NEXT_PUBLIC_FF_<FLAG_NAME>
//
// Define flags in one place by calling `registerFlags` at startup (e.g., in `app/providers.tsx` or a server init file).
// You can then query flags via `isEnabled` (for boolean flags) or `getValue`.

type FlagType = 'boolean' | 'string' | 'number' | 'json'

export interface FeatureFlagDefinition<T = unknown> {
  // Canonical uppercase key (e.g., 'NEW_CHECKOUT')
  key: string
  // Short description of the flag's purpose
  description?: string
  // Default value when env var not set
  default: T
  // Whether to expose to client bundles via `NEXT_PUBLIC_FF_<KEY>`
  exposeToClient?: boolean
  // Flag value type for parsing; defaults to 'boolean'
  type?: FlagType
}

type AnyDef = FeatureFlagDefinition<unknown>

const registry: Record<string, AnyDef> = {}

export function registerFlags(defs: Record<string, AnyDef>) {
  for (const [k, def] of Object.entries(defs)) {
    const key = def.key || k
    const upper = key.toUpperCase()
    registry[upper] = {
      type: 'boolean',
      exposeToClient: false,
      ...def,
      key: upper,
    }
  }
}

export function getRegisteredFlags(): Readonly<Record<string, AnyDef>> {
  return registry
}

export function getServerEnvVarName(key: string) {
  return `FF_${key.toUpperCase()}`
}

export function getClientEnvVarName(key: string) {
  return `NEXT_PUBLIC_FF_${key.toUpperCase()}`
}

function parseValue(raw: string | undefined, def: AnyDef) {
  const type: FlagType = def.type ?? 'boolean'
  if (raw == null) return def.default

  switch (type) {
    case 'boolean': {
      const val = raw.trim().toLowerCase()
      return ['1', 'true', 'yes', 'on', 'y', 't'].includes(val)
    }
    case 'number': {
      const n = Number(raw)
      return Number.isFinite(n) ? n : def.default
    }
    case 'json': {
      try {
        return JSON.parse(raw)
      } catch {
        return def.default
      }
    }
    case 'string':
    default:
      return raw
  }
}

function readEnv(def: AnyDef) {
  const serverName = getServerEnvVarName(def.key)
  const clientName = getClientEnvVarName(def.key)

  // Prefer client var if defined and exposeToClient is true.
  if (def.exposeToClient && typeof process !== 'undefined') {
    const fromClient = process.env[clientName]
    if (fromClient != null) return parseValue(fromClient, def)
  }

  const fromServer = typeof process !== 'undefined' ? process.env[serverName] : undefined
  return parseValue(fromServer, def)
}

export function getValue<T = unknown>(key: string): T {
  const def = registry[key.toUpperCase()]
  if (!def) throw new Error(`Unknown feature flag: ${key}`)
  return readEnv(def) as T
}

export function isEnabled(key: string): boolean {
  const def = registry[key.toUpperCase()]
  if (!def) throw new Error(`Unknown feature flag: ${key}`)
  const value = readEnv(def)
  if ((def.type ?? 'boolean') !== 'boolean') {
    // Non-boolean flags are considered enabled if truthy
    return Boolean(value)
  }
  return Boolean(value)
}

// Utility to quickly define a boolean flag with sensible defaults
export function defineBooleanFlag(params: Omit<FeatureFlagDefinition<boolean>, 'type'>): FeatureFlagDefinition<boolean> {
  return { ...params, type: 'boolean' }
}

// Example usage (do not enable by default). To add flags, import registerFlags and pass your definitions:
// registerFlags({
//   NEW_CHECKOUT: defineBooleanFlag({
//     key: 'NEW_CHECKOUT',
//     description: 'Enable the new checkout flow',
//     default: false,
//     exposeToClient: true,
//   }),
// })
