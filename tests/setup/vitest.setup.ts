import { beforeEach, vi } from 'vitest';

type CookieRecord = { name: string; value: string };

const cookieStore = new Map<string, string>();

const createCookieApi = () => ({
  get: (name: string): CookieRecord | undefined => {
    if (!cookieStore.has(name)) {
      return undefined;
    }
    return { name, value: cookieStore.get(name)! };
  },
  getAll: (): CookieRecord[] =>
    Array.from(cookieStore.entries()).map(([name, value]) => ({ name, value })),
  set: (
    name: string,
    value: string | { value: string }
  ) => {
    const val = typeof value === 'string' ? value : value?.value ?? '';
    cookieStore.set(name, val);
  },
  delete: (name: string) => {
    cookieStore.delete(name);
  },
  has: (name: string) => cookieStore.has(name),
  clear: () => cookieStore.clear()
});

vi.mock('next/headers', () => ({
  cookies: createCookieApi
}));

beforeEach(() => {
  cookieStore.clear();
});
