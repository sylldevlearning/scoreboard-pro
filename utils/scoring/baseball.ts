export const emptyInnings = (innings: number): number[] => Array(innings).fill(0);

/** Returns a new array with `delta` applied to one inning. Negative values are allowed. */
export function applyInningScore(scores: number[], inning: number, delta: number): number[] {
  const next = [...scores];
  next[inning] = next[inning] + delta;
  return next;
}

export const totalRuns = (scores: number[]): number => scores.reduce((a, b) => a + b, 0);

/** Parses the innings field; null when the text isn't a usable count (empty, 0, NaN). */
export function parseInningsInput(text: string): number | null {
  const n = parseInt(text, 10);
  return Number.isFinite(n) && n >= 1 ? n : null;
}
