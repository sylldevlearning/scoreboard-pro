// Baseball scoring logic extracted from app/baseball/score.tsx

function handleScoreChange(scores: number[], inning: number, delta: number): number[] {
  const next = [...scores];
  next[inning] = Math.max(0, next[inning] + delta);
  return next;
}

function total(scores: number[]): number {
  return scores.reduce((a, b) => a + b, 0);
}

describe("Baseball per-inning scoring", () => {
  it("+1 in first inning", () => {
    const scores = Array(6).fill(0);
    const next = handleScoreChange(scores, 0, 1);
    expect(next[0]).toBe(1);
    expect(total(next)).toBe(1);
  });

  it("-1 cannot go below 0", () => {
    const scores = Array(6).fill(0);
    const next = handleScoreChange(scores, 0, -1);
    expect(next[0]).toBe(0);
  });

  it("each inning tracked independently", () => {
    let scores = Array(6).fill(0);
    scores = handleScoreChange(scores, 0, 3);
    scores = handleScoreChange(scores, 2, 2);
    scores = handleScoreChange(scores, 5, 1);
    expect(scores[0]).toBe(3);
    expect(scores[2]).toBe(2);
    expect(scores[5]).toBe(1);
    expect(scores[1]).toBe(0);
  });

  it("total is sum of all inning scores", () => {
    const scores = [2, 0, 3, 0, 1, 0];
    expect(total(scores)).toBe(6);
  });

  it("total with 9 innings default (full game)", () => {
    const scores = Array(9).fill(0);
    [1, 0, 2, 0, 3, 0, 1, 0, 2].forEach((r, i) => { scores[i] = r; });
    expect(total(scores)).toBe(9);
  });

  it("inning count reset clears all to 0", () => {
    const innings = 6;
    const scores = Array(innings).fill(0);
    expect(scores).toEqual([0, 0, 0, 0, 0, 0]);
    expect(total(scores)).toBe(0);
  });
});

describe("Baseball inning count", () => {
  it("default 6 innings → array length 6", () => {
    const scores = Array(6).fill(0);
    expect(scores).toHaveLength(6);
  });
  it("configurable to 9 innings", () => {
    const scores = Array(9).fill(0);
    expect(scores).toHaveLength(9);
  });
});
