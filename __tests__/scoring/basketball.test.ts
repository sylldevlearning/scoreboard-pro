import { applyScoreDelta } from "@/utils/scoring/common";

describe("Basketball scoring", () => {
  it("+1 lancer franc", () => expect(applyScoreDelta(0, 1)).toBe(1));
  it("+2 panier intérieur", () => expect(applyScoreDelta(0, 2)).toBe(2));
  it("+3 tir à 3 points", () => expect(applyScoreDelta(0, 3)).toBe(3));
  it("realistic first quarter: 3+2+1+3+2 = 11", () => {
    expect([3, 2, 1, 3, 2].reduce(applyScoreDelta, 0)).toBe(11);
  });
});

describe("Basketball eraser (-1)", () => {
  it("eraser 3 times from 5 → 2", () => expect([-1, -1, -1].reduce(applyScoreDelta, 5)).toBe(2));
  it("eraser can make score negative", () => expect(applyScoreDelta(0, -1)).toBe(-1));
});
