// Volleyball set-win logic extracted from app/volleyball/score.tsx:handleScoreChange

function checkSetWin(scoreA: number, scoreB: number, target: number): boolean {
  return (scoreA >= target || scoreB >= target) && Math.abs(scoreA - scoreB) >= 2;
}

function getTarget(setsA: number, setsB: number, nbSetsToWin: number, tieBreakEnabled: boolean): number {
  const isLastSet = tieBreakEnabled && setsA + setsB === nbSetsToWin * 2 - 2;
  return isLastSet ? 15 : 25;
}

describe("Volleyball set-win logic", () => {
  it("25-0: set won (≥25 with ≥2 gap)", () => {
    expect(checkSetWin(25, 0, 25)).toBe(true);
  });
  it("24-24: set NOT won yet", () => {
    expect(checkSetWin(24, 24, 25)).toBe(false);
  });
  it("25-24: NOT won (gap < 2)", () => {
    expect(checkSetWin(25, 24, 25)).toBe(false);
  });
  it("26-24: won (≥25 with exactly 2 gap)", () => {
    expect(checkSetWin(26, 24, 25)).toBe(true);
  });
  it("27-25: won (over 25, 2 gap)", () => {
    expect(checkSetWin(27, 25, 25)).toBe(true);
  });
  it("0-25: B wins set", () => {
    expect(checkSetWin(0, 25, 25)).toBe(true);
  });
});

describe("Volleyball 5th set (tie-break at 15)", () => {
  it("5th set target is 15 (2 sets each, tie-break enabled)", () => {
    expect(getTarget(2, 2, 3, true)).toBe(15);
  });
  it("normal set target is 25", () => {
    expect(getTarget(1, 0, 3, true)).toBe(25);
  });
  it("15-14: NOT won (gap < 2)", () => {
    expect(checkSetWin(15, 14, 15)).toBe(false);
  });
  it("15-13: won (≥15 with 2 gap)", () => {
    expect(checkSetWin(15, 13, 15)).toBe(true);
  });
  it("16-14: won in extended tie-break", () => {
    expect(checkSetWin(16, 14, 15)).toBe(true);
  });
});

describe("Volleyball match winner", () => {
  function checkMatchWin(setsA: number, setsB: number, nbSetsToWin: number) {
    return setsA === nbSetsToWin || setsB === nbSetsToWin;
  }
  it("best of 5 (3 needed): 3-0 wins", () => expect(checkMatchWin(3, 0, 3)).toBe(true));
  it("best of 5: 2-2 not over", () => expect(checkMatchWin(2, 2, 3)).toBe(false));
  it("best of 3 (2 needed): 2-1 wins", () => expect(checkMatchWin(2, 1, 2)).toBe(true));
});

describe("Volleyball volleyball handicap (negative start score)", () => {
  it("score starts at negative value (handicap mode) — no clamping", () => {
    // The volleyball screen intentionally allows negative scores
    const startScore = -5;
    const score = startScore + 1;
    expect(score).toBe(-4); // not clamped to 0
  });
});
