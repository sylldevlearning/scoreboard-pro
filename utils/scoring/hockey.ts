import type { Team } from "./common";

export type Period = 1 | 2 | 3 | "OT";

type PenaltyCard = { team: Team; cardType: string; expired: boolean; remainingSeconds?: number };

/** Next period, or null when the game is over (3rd period not tied, or overtime). */
export function nextPeriod(current: Period, scoreA: number, scoreB: number): Period | null {
  if (current === 1) return 2;
  if (current === 2) return 3;
  if (current === 3 && scoreA === scoreB) return "OT";
  return null;
}

export const canGoNextPeriod = (current: Period, scoreA: number, scoreB: number): boolean =>
  nextPeriod(current, scoreA, scoreB) !== null;

/** Skaters on ice: 5 minus timed penalties and match penalties, never below 3. */
export function playersOnIce(cards: PenaltyCard[], team: Team): number {
  const timedOut = cards.filter(
    (c) => c.team === team && !c.expired && c.remainingSeconds !== undefined
  ).length;
  const expelled = cards.filter(
    (c) => c.team === team && c.cardType === "match" && !c.expired
  ).length;
  return Math.max(3, 5 - timedOut - expelled);
}

export const activePenaltyCount = (cards: PenaltyCard[], team: Team): number =>
  cards.filter((c) => c.team === team && !c.expired).length;

export type Strength = "superiority" | "inferiority" | "equal";

/** Power-play state of `team` given each side's active penalties. */
export function getStrength(cards: PenaltyCard[], team: Team): Strength {
  const own = activePenaltyCount(cards, team);
  const opp = activePenaltyCount(cards, team === "A" ? "B" : "A");
  if (own > opp) return "inferiority";
  if (opp > own) return "superiority";
  return "equal";
}

export const URGENT_PENALTY_SECONDS = 30;
export const isPenaltyUrgent = (remainingSeconds: number): boolean =>
  remainingSeconds <= URGENT_PENALTY_SECONDS;
