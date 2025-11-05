'use client';

// Minimal PostHog HTTP client (no external dependency)

type PosthogProps = Record<string, unknown>;

const DEFAULT_HOST = 'https://eu.i.posthog.com';

const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host =
  (process.env.NEXT_PUBLIC_POSTHOG_HOST as string | undefined) ||
  (process.env.POSTHOG_HOST as string | undefined) ||
  DEFAULT_HOST;

const storageKey = 'ph_distinct_id';

let distinctId: string | null = null;
let identifiedUserId: string | null = null;

const ensureDistinctId = (): string => {
  if (identifiedUserId) return identifiedUserId;
  if (distinctId) return distinctId;
  try {
    const fromStorage = window.localStorage.getItem(storageKey);
    if (fromStorage) {
      distinctId = fromStorage;
      return distinctId;
    }
  } catch {}
  const generated = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  try {
    window.localStorage.setItem(storageKey, generated);
  } catch {}
  distinctId = generated;
  return distinctId;
};

const post = async (path: string, payload: unknown) => {
  if (!apiKey) return; // no-op when not configured
  try {
    await fetch(`${host.replace(/\/$/, '')}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
      credentials: 'omit',
    });
  } catch {
    // swallow errors
  }
};

export const identify = (userId: string, properties?: PosthogProps) => {
  identifiedUserId = userId;
  try {
    window.localStorage.setItem(storageKey, userId);
  } catch {}
  // Send as capture $identify for completeness
  void post('/capture/', {
    api_key: apiKey,
    event: '$identify',
    distinct_id: userId,
    properties: properties ?? {},
  });
};

export const capture = (event: string, properties?: PosthogProps) => {
  const id = ensureDistinctId();
  void post('/capture/', {
    api_key: apiKey,
    event,
    distinct_id: id,
    properties: properties ?? {},
  });
};

export const getHost = () => host;
export const isEnabled = () => Boolean(apiKey);

