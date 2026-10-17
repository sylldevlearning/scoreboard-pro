import { applyScoreDelta } from "@/utils/scoring/common";
import { shouldAddAutoRed } from "@/utils/scoring/football";

describe("Football scoring", () => {
  it("+1 increments score", () => expect(applyScoreDelta(0, 1)).toBe(1));
  it("-1 decrements score", () => expect(applyScoreDelta(3, -1)).toBe(2));
  it("eraser can make score negative", () => expect(applyScoreDelta(0, -1)).toBe(-1));
  it("eraser 5 times from 0 → -5", () => {
    let score = 0;
    for (let i = 0; i < 5; i++) score = applyScoreDelta(score, -1);
    expect(score).toBe(-5);
  });
});

// 2nd yellow → auto red
describe("Football card logic", () => {
  it("1st yellow does not trigger red", () => expect(shouldAddAutoRed("yellow", 0)).toBe(false));
  it("2nd yellow triggers red", () => expect(shouldAddAutoRed("yellow", 1)).toBe(true));
  it("3rd yellow also triggers red (already expelled case)", () => {
    expect(shouldAddAutoRed("yellow", 2)).toBe(true);
  });
  it("a direct red never adds a second red", () => expect(shouldAddAutoRed("red", 1)).toBe(false));
});
