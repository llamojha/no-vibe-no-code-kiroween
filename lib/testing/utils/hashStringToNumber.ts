/**
 * Deterministically hashes a string into a number between min and max (inclusive).
 */
export function hashStringToNumber(input: string, min = 0, max = 100): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0; // Force 32bit
  }
  const range = max - min;
  const normalized = Math.abs(hash % (range + 1));
  return min + normalized;
}
