const handleScore = (score: number, delta: number) => Math.max(0, score + delta);

function handleUndo(
  score: number,
  lastAction: number | null
): { score: number; lastAction: null } | null {
  if (lastAction === null) return null;
  return { score: Math.max(0, score - lastAction), lastAction: null };
}

describe("Basketball scoring", () => {
  it("+1 lancer franc", () => expect(handleScore(0, 1)).toBe(1));
  it("+2 panier intérieur", () => expect(handleScore(0, 2)).toBe(2));
  it("+3 tir à 3 points", () => expect(handleScore(0, 3)).toBe(3));
  it("score cannot go below 0", () => expect(handleScore(0, -1)).toBe(0));
  it("realistic first quarter: 3+2+1+3+2 = 11", () => {
    let score = 0;
    [3, 2, 1, 3, 2].forEach((pts) => { score = handleScore(score, pts); });
    expect(score).toBe(11);
  });
});

describe("Basketball undo last action", () => {
  it("undo +3 tir: 13 → 10", () => {
    const result = handleUndo(13, 3);
    expect(result?.score).toBe(10);
    expect(result?.lastAction).toBeNull();
  });
  it("undo +2 panier: 8 → 6", () => {
    const result = handleUndo(8, 2);
    expect(result?.score).toBe(6);
  });
  it("undo +1 lancer: 5 → 4", () => {
    const result = handleUndo(5, 1);
    expect(result?.score).toBe(4);
  });
  it("undo when no last action → returns null (no-op)", () => {
    expect(handleUndo(10, null)).toBeNull();
  });
  it("undo cannot make score go below 0", () => {
    const result = handleUndo(1, 3);
    expect(result?.score).toBe(0);
  });
  it("undo clears lastAction so double-undo is not possible", () => {
    const first = handleUndo(10, 2)!;
    expect(first.lastAction).toBeNull();
    const second = handleUndo(first.score, first.lastAction);
    expect(second).toBeNull();
  });
});
