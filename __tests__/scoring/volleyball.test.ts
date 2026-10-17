import { getSetTarget, isMatchWon, isSetWon } from "@/utils/scoring/volleyball";
import { applyScoreDelta } from "@/utils/scoring/common";

describe("Volleyball set-win logic", () => {
  it("25-0: set won (≥25 with ≥2 gap)", () => expect(isSetWon(25, 0, 25)).toBe(true));
  it("24-24: set NOT won yet", () => expect(isSetWon(24, 24, 25)).toBe(false));
  it("25-24: NOT won (gap < 2)", () => expect(isSetWon(25, 24, 25)).toBe(false));
  it("26-24: won (≥25 with exactly 2 gap)", () => expect(isSetWon(26, 24, 25)).toBe(true));
  it("27-25: won (over 25, 2 gap)", () => expect(isSetWon(27, 25, 25)).toBe(true));
  it("0-25: B wins set", () => expect(isSetWon(0, 25, 25)).toBe(true));
});

describe("Volleyball 5th set (tie-break at 15)", () => {
  it("5th set target is 15 (2 sets each, tie-break enabled)", () => {
    expect(getSetTarget(2, 2, 3, true)).toBe(15);
  });
  it("5th set target stays 25 when tie-break is disabled", () => {
    expect(getSetTarget(2, 2, 3, false)).toBe(25);
  });
  it("normal set target is 25", () => expect(getSetTarget(1, 0, 3, true)).toBe(25));
  it("best of 3: deciding 3rd set at 1-1 is played to 15", () => {
    expect(getSetTarget(1, 1, 2, true)).toBe(15);
  });
  it("15-14: NOT won (gap < 2)", () => expect(isSetWon(15, 14, 15)).toBe(false));
  it("15-13: won (≥15 with 2 gap)", () => expect(isSetWon(15, 13, 15)).toBe(true));
  it("16-14: won in extended tie-break", () => expect(isSetWon(16, 14, 15)).toBe(true));
});

describe("Volleyball match winner", () => {
  it("best of 5 (3 needed): 3-0 wins", () => expect(isMatchWon(3, 0, 3)).toBe(true));
  it("best of 5: 2-2 not over", () => expect(isMatchWon(2, 2, 3)).toBe(false));
  it("best of 3 (2 needed): 2-1 wins", () => expect(isMatchWon(2, 1, 2)).toBe(true));
  it("sets above the target still count as won (setting lowered mid-match)", () => {
    expect(isMatchWon(3, 1, 2)).toBe(true);
  });
});

describe("Volleyball handicap (negative start score)", () => {
  it("score starts at negative value (handicap mode) — no clamping", () => {
    expect(applyScoreDelta(-5, 1)).toBe(-4);
  });
});
