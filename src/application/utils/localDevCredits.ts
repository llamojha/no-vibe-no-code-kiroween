import { UserId } from "../../domain/value-objects/UserId";
import { ICache } from "../../infrastructure/cache/ICache";

const LOCAL_DEV_CACHE_KEY_PREFIX = "local_dev_credits:";
const LOCAL_DEV_STATE_TTL_SECONDS = 60 * 60 * 24; // 24 hours
const DEFAULT_LOCAL_DEV_CREDITS = parseInt(
  process.env.LOCAL_DEV_CREDITS || "999",
  10
);

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
  const cached = await cache.get<number>(cacheKey);

  if (typeof cached === "number") {
    return cached;
  }

  await cache.set(cacheKey, DEFAULT_LOCAL_DEV_CREDITS, LOCAL_DEV_STATE_TTL_SECONDS);
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
  await cache.set(
    getLocalDevCacheKey(userId),
    Math.max(0, credits),
    LOCAL_DEV_STATE_TTL_SECONDS
  );
}

export const LOCAL_DEV_DEFAULT_CREDITS = DEFAULT_LOCAL_DEV_CREDITS;
