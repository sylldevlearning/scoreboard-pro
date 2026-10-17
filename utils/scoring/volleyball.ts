export const SET_TARGET = 25;
export const TIE_BREAK_TARGET = 15;

/** Points needed in the current set: 15 in the deciding set when tie-break is on. */
export function getSetTarget(
  setsA: number,
  setsB: number,
  nbSetsToWin: number,
  tieBreakEnabled: boolean
): number {
  const isLastSet = tieBreakEnabled && setsA + setsB === nbSetsToWin * 2 - 2;
  return isLastSet ? TIE_BREAK_TARGET : SET_TARGET;
}

/** A set is won at the target with a 2-point lead. */
export const isSetWon = (scoreA: number, scoreB: number, target: number): boolean =>
  (scoreA >= target || scoreB >= target) && Math.abs(scoreA - scoreB) >= 2;

export const isMatchWon = (setsA: number, setsB: number, nbSetsToWin: number): boolean =>
  setsA >= nbSetsToWin || setsB >= nbSetsToWin;
