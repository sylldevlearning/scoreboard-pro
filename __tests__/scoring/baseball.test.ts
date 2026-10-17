import { applyInningScore, emptyInnings, parseInningsInput, totalRuns } from "@/utils/scoring/baseball";

describe("Baseball per-inning scoring", () => {
  it("+1 in first inning", () => {
    const next = applyInningScore(emptyInnings(6), 0, 1);
    expect(next[0]).toBe(1);
    expect(totalRuns(next)).toBe(1);
  });

  it("does not mutate the previous array", () => {
    const scores = emptyInnings(6);
    applyInningScore(scores, 0, 1);
    expect(scores[0]).toBe(0);
  });

  it("-1 can go negative", () => {
    expect(applyInningScore(emptyInnings(6), 0, -1)[0]).toBe(-1);
  });

  it("eraser 5 times from 0 → -5", () => {
    let scores = emptyInnings(6);
    for (let i = 0; i < 5; i++) scores = applyInningScore(scores, 0, -1);
    expect(scores[0]).toBe(-5);
  });

  it("each inning tracked independently", () => {
    let scores = emptyInnings(6);
    scores = applyInningScore(scores, 0, 3);
    scores = applyInningScore(scores, 2, 2);
    scores = applyInningScore(scores, 5, 1);
    expect(scores).toEqual([3, 0, 2, 0, 0, 1]);
  });

  it("total is sum of all inning scores", () => {
    expect(totalRuns([2, 0, 3, 0, 1, 0])).toBe(6);
  });

  it("total with 9 innings (full game)", () => {
    expect(totalRuns([1, 0, 2, 0, 3, 0, 1, 0, 2])).toBe(9);
  });
});

describe("Baseball inning count", () => {
  it("default 6 innings → array of 6 zeros", () => {
    expect(emptyInnings(6)).toEqual([0, 0, 0, 0, 0, 0]);
  });
  it("configurable to 9 innings", () => expect(emptyInnings(9)).toHaveLength(9));
});

describe("Baseball innings input", () => {
  it("parses a valid count", () => expect(parseInningsInput("9")).toBe(9));
  it("empty field (user is retyping) is ignored", () => expect(parseInningsInput("")).toBeNull());
  it("0 is ignored", () => expect(parseInningsInput("0")).toBeNull());
  it("non-numeric text is ignored", () => expect(parseInningsInput("abc")).toBeNull());
});
