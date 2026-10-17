import type { Team } from "./common";

export type TennisScore = 0 | 15 | 30 | 40 | "A" | "=";

export type TennisState = {
  scoreA: TennisScore; scoreB: TennisScore;
  gamesA: number; gamesB: number;
  setsA: number; setsB: number;
  setsHistory: number[][];
  isTieBreak: boolean;
  matchWinner: Team | null;
};

export type TennisRules = {
  gamesToWinSet: number;
  setsToWin: number;
  tieBreakEnabled: boolean;
};

export const TIE_BREAK_POINTS = 7;

export const initialTennisState: TennisState = {
  scoreA: 0, scoreB: 0,
  gamesA: 0, gamesB: 0,
  setsA: 0, setsB: 0,
  setsHistory: [],
  isTieBreak: false,
  matchWinner: null,
};

const SCORE_ORDER = [0, 15, 30, 40] as const;

/** 0 → 15 → 30 → 40, staying at 40 (the caller handles the game win). */
export function nextScore(current: TennisScore): TennisScore {
  const index = (SCORE_ORDER as readonly number[]).indexOf(current as number);
  return index < SCORE_ORDER.length - 1 ? SCORE_ORDER[index + 1] : 40;
}

export const isMatchOver = (s: TennisState, rules: TennisRules): boolean =>
  s.setsA >= rules.setsToWin || s.setsB >= rules.setsToWin;

function finishSet(s: TennisState, gamesA: number, gamesB: number, rules: TennisRules): TennisState {
  const aWins = gamesA > gamesB;
  const setsA = aWins ? s.setsA + 1 : s.setsA;
  const setsB = aWins ? s.setsB : s.setsB + 1;
  const matchWinner: Team | null =
    setsA >= rules.setsToWin ? "A" : setsB >= rules.setsToWin ? "B" : s.matchWinner;
  return {
    ...s,
    scoreA: 0, scoreB: 0,
    gamesA: 0, gamesB: 0,
    setsA, setsB,
    setsHistory: [...s.setsHistory, [gamesA, gamesB]],
    isTieBreak: false,
    matchWinner,
  };
}

function winGame(s: TennisState, team: Team, rules: TennisRules): TennisState {
  const gamesA = team === "A" ? s.gamesA + 1 : s.gamesA;
  const gamesB = team === "B" ? s.gamesB + 1 : s.gamesB;

  if (rules.tieBreakEnabled && gamesA === rules.gamesToWinSet && gamesB === rules.gamesToWinSet) {
    return { ...s, gamesA, gamesB, scoreA: 0, scoreB: 0, isTieBreak: true };
  }
  if ((gamesA >= rules.gamesToWinSet || gamesB >= rules.gamesToWinSet) && Math.abs(gamesA - gamesB) >= 2) {
    return finishSet(s, gamesA, gamesB, rules);
  }
  return { ...s, gamesA, gamesB, scoreA: 0, scoreB: 0 };
}

/** State after `team` wins a point. Points after the match is over are ignored. */
export function applyPoint(s: TennisState, team: Team, rules: TennisRules): TennisState {
  if (isMatchOver(s, rules)) return s;

  if (s.isTieBreak) {
    const a = Number(s.scoreA) + (team === "A" ? 1 : 0);
    const b = Number(s.scoreB) + (team === "B" ? 1 : 0);
    if ((a >= TIE_BREAK_POINTS || b >= TIE_BREAK_POINTS) && Math.abs(a - b) >= 2) {
      return finishSet(s, a > b ? s.gamesA + 1 : s.gamesA, b > a ? s.gamesB + 1 : s.gamesB, rules);
    }
    return { ...s, scoreA: a as TennisScore, scoreB: b as TennisScore };
  }

  const own = team === "A" ? s.scoreA : s.scoreB;
  const opp = team === "A" ? s.scoreB : s.scoreA;
  const withScores = (ownScore: TennisScore, oppScore: TennisScore): TennisState =>
    team === "A"
      ? { ...s, scoreA: ownScore, scoreB: oppScore }
      : { ...s, scoreA: oppScore, scoreB: ownScore };

  if (own === 40 && opp === 40) return withScores("A", opp);   // deuce → advantage
  if (own === "A") return winGame(s, team, rules);            // advantage → game
  if (opp === "A") return withScores("=", "=");               // advantage lost → deuce
  if (own === "=") return withScores("A", "=");               // deuce → advantage
  if (own === 40) return winGame(s, team, rules);
  return withScores(nextScore(own), opp);
}

export type SnapshotEntry = { by: Team; state: TennisState };

/**
 * Undo the last point scored by `team`: restores the state saved before that
 * point and drops every later entry (they depended on it).
 */
export function eraseLastPoint(
  stack: SnapshotEntry[],
  team: Team
): { stack: SnapshotEntry[]; state: TennisState | null } {
  for (let i = stack.length - 1; i >= 0; i--) {
    if (stack[i].by === team) return { stack: stack.slice(0, i), state: stack[i].state };
  }
  return { stack, state: null };
}
