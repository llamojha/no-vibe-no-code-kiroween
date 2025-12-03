import { UserId } from "../../domain/value-objects/UserId";
import { ICache } from "../../infrastructure/cache/ICache";

const LOCAL_DEV_CACHE_KEY_PREFIX = "local_dev_credits:";
const LOCAL_DEV_STATE_TTL_SECONDS = 60 * 60 * 24; // 24 hours
const DEFAULT_LOCAL_DEV_CREDITS = parseInt(
  process.env.LOCAL_DEV_CREDITS || "999",
  10
);
const GLOBAL_STATE_KEY = "__LOCAL_DEV_CREDITS_STATE__";

type LocalDevCreditEntry = {
  credits: number;
  expiresAt: number;
};

type GlobalCreditState = Map<string, LocalDevCreditEntry>;

function getGlobalState(): GlobalCreditState {
  const globalObject = globalThis as typeof globalThis & {
    [GLOBAL_STATE_KEY]?: GlobalCreditState;
  };

  if (!globalObject[GLOBAL_STATE_KEY]) {
    globalObject[GLOBAL_STATE_KEY] = new Map();
  }

  return globalObject[GLOBAL_STATE_KEY]!;
}

function readCreditsFromGlobal(userId: UserId): number | null {
  const store = getGlobalState();
  const entry = store.get(userId.value);

  if (!entry) {
    return null;
  }

  if (entry.expiresAt < Date.now()) {
    store.delete(userId.value);
    return null;
  }

  return entry.credits;
}

function writeCreditsToGlobal(userId: UserId, credits: number): void {
  const store = getGlobalState();
  store.set(userId.value, {
    credits,
    expiresAt: Date.now() + LOCAL_DEV_STATE_TTL_SECONDS * 1000,
  });
}

/**
 * Determine whether the application is running in local development bypass mode
 */
export function isLocalDevModeEnabled(): boolean {
  const nodeEnv = process.env.NODE_ENV || "development";
  return (
    nodeEnv === "development" || process.env.FF_LOCAL_DEV_MODE === "true"
  );
}

/**
 * Get cache key used to persist local dev credit state
 */
function getLocalDevCacheKey(userId: UserId): string {
  return `${LOCAL_DEV_CACHE_KEY_PREFIX}${userId.value}`;
}

/**
 * Retrieve the simulated credit balance for local development, initializing it if needed
 */
export async function getOrInitializeLocalDevCredits(
  cache: ICache,
  userId: UserId
): Promise<number> {
  const cacheKey = getLocalDevCacheKey(userId);
  const globalCredits = readCreditsFromGlobal(userId);

  if (typeof globalCredits === "number") {
    await cache.set(cacheKey, globalCredits, LOCAL_DEV_STATE_TTL_SECONDS);
    return globalCredits;
  }

  const cached = await cache.get<number>(cacheKey);

  if (typeof cached === "number") {
    writeCreditsToGlobal(userId, cached);
    return cached;
  }

  writeCreditsToGlobal(userId, DEFAULT_LOCAL_DEV_CREDITS);
  await cache.set(
    cacheKey,
    DEFAULT_LOCAL_DEV_CREDITS,
    LOCAL_DEV_STATE_TTL_SECONDS
  );
  return DEFAULT_LOCAL_DEV_CREDITS;
}

/**
 * Persist a new simulated credit balance for local development mode
 */
export async function setLocalDevCredits(
  cache: ICache,
  userId: UserId,
  credits: number
): Promise<void> {
  const normalizedCredits = Math.max(0, credits);
  writeCreditsToGlobal(userId, normalizedCredits);
  await cache.set(
    getLocalDevCacheKey(userId),
    normalizedCredits,
    LOCAL_DEV_STATE_TTL_SECONDS
  );
}

export const LOCAL_DEV_DEFAULT_CREDITS = DEFAULT_LOCAL_DEV_CREDITS;
