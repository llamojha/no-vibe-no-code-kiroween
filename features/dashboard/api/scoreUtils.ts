/**
 * Normalize a raw numeric score to the 0-5 range with single decimal precision.
 */
export function normalizeFivePointScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const clamped = Math.max(0, Math.min(value, 5));
  return Number(clamped.toFixed(1));
}

type ScoreSource = {
  finalScore?: number | null;
  score?: number | null;
} | null | undefined;

/**
 * Derive a 0-5 score from persisted analysis payloads.
 * Supports legacy `finalScore` (already 0-5) and new `score` fields (0-100).
 */
export function deriveFivePointScore(source: ScoreSource): number {
  if (!source) {
    return 0;
  }

  if (typeof source.finalScore === "number" && !Number.isNaN(source.finalScore)) {
    return normalizeFivePointScore(source.finalScore);
  }

  if (typeof source.score === "number" && !Number.isNaN(source.score)) {
    const rawFivePoint = source.score > 5 ? source.score / 20 : source.score;
    return normalizeFivePointScore(rawFivePoint);
  }

  return 0;
}
