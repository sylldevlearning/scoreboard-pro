import { otherTeam, type Team } from "./common";

export type { Team };

export const MAX_WICKETS = 10;

export const addWicket = (wickets: number): number => Math.min(MAX_WICKETS, wickets + 1);

/** Wickets can't go below 0; runs and overs corrections may go negative on purpose. */
export const correctWicket = (wickets: number): number => Math.max(0, wickets - 1);

/** Batting team for the second innings. */
export const nextBattingTeam = (battingTeam: Team): Team => otherTeam(battingTeam);

export type ChaseResult = { winner: Team | "draw" } | null;

/**
 * Result of the second innings, or null while the chase is still on.
 * The chasing team wins as soon as it passes the first innings total; it
 * loses (or draws on equal runs) once it is all out.
 */
export function getChaseResult(
  chasingRuns: number,
  chasingWickets: number,
  targetRuns: number,
  chasingTeam: Team
): ChaseResult {
  if (chasingRuns > targetRuns) return { winner: chasingTeam };
  if (chasingWickets >= MAX_WICKETS) {
    return { winner: chasingRuns === targetRuns ? "draw" : otherTeam(chasingTeam) };
  }
  return null;
}

/** Final result when the innings is ended manually. */
export function getFinalResult(runsA: number, runsB: number): Team | "draw" {
  if (runsA > runsB) return "A";
  if (runsB > runsA) return "B";
  return "draw";
}
