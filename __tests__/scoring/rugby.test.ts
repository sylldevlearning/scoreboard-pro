import { applyScoreDelta } from "@/utils/scoring/common";

// Player count (yellow = sin bin, red = sent off) lives in useCardManager and is
// covered by __tests__/hooks/useCardManager.test.ts (getPlayersOnField).

describe("Rugby scoring", () => {
  it("+2 transformation", () => expect(applyScoreDelta(5, 2)).toBe(7));
  it("+3 pénalité/drop", () => expect(applyScoreDelta(0, 3)).toBe(3));
  it("+5 essai", () => expect(applyScoreDelta(7, 5)).toBe(12));
  it("typical match: 3 essais + 3 transfo + 1 drop = 24", () => {
    expect([5, 2, 5, 2, 5, 2, 3].reduce(applyScoreDelta, 0)).toBe(24);
  });
});

describe("Rugby eraser (-1)", () => {
  it("eraser 3 times from 7 → 4", () => {
    expect([-1, -1, -1].reduce(applyScoreDelta, 7)).toBe(4);
  });
  it("eraser can make score negative", () => expect(applyScoreDelta(0, -1)).toBe(-1));
});
