// Rugby scoring + undo-last-action logic extracted from app/rugby/score.tsx

const handleScore = (score: number, delta: number): number => Math.max(0, score + delta);

function handleUndo(
  score: number,
  lastAction: number | null
): { score: number; lastAction: null } | null {
  if (lastAction === null) return null;
  return { score: Math.max(0, score - lastAction), lastAction: null };
}

describe("Rugby scoring", () => {
  it("+2 transformation", () => expect(handleScore(5, 2)).toBe(7));
  it("+3 pénalité/drop", () => expect(handleScore(0, 3)).toBe(3));
  it("+5 essai", () => expect(handleScore(7, 5)).toBe(12));
  it("score cannot go below 0", () => expect(handleScore(0, -1)).toBe(0));
  it("typical sequence: essai (5) + transformation (2) = 7", () => {
    let score = 0;
    score = handleScore(score, 5);
    score = handleScore(score, 2);
    expect(score).toBe(7);
  });
  it("typical match: 3 essais + 3 transfo + 1 drop = 24", () => {
    let score = 0;
    score = handleScore(score, 5);
    score = handleScore(score, 2);
    score = handleScore(score, 5);
    score = handleScore(score, 2);
    score = handleScore(score, 5);
    score = handleScore(score, 2);
    score = handleScore(score, 3);
    expect(score).toBe(24);
  });
});

describe("Rugby undo last action", () => {
  it("undo +5 essai: 5 → 0", () => {
    const result = handleUndo(5, 5);
    expect(result?.score).toBe(0);
    expect(result?.lastAction).toBeNull();
  });
  it("undo +3 drop: 10 → 7", () => {
    const result = handleUndo(10, 3);
    expect(result?.score).toBe(7);
  });
  it("undo +2 transfo: 7 → 5", () => {
    const result = handleUndo(7, 2);
    expect(result?.score).toBe(5);
  });
  it("undo when no last action → returns null (no-op)", () => {
    expect(handleUndo(5, null)).toBeNull();
  });
  it("undo cannot make score go below 0", () => {
    // Score is 3 but last action was +5 (e.g. reset mid-game edge case)
    const result = handleUndo(3, 5);
    expect(result?.score).toBe(0);
  });
  it("undo clears lastAction so double-undo is not possible", () => {
    const first = handleUndo(10, 3)!;
    expect(first.lastAction).toBeNull();
    const second = handleUndo(first.score, first.lastAction);
    expect(second).toBeNull();
  });
});

describe("Rugby player count", () => {
  const getPlayersOnField = (inPrison: number, expelled: number, max: number) =>
    Math.max(0, max - inPrison - expelled);

  it("full team when no cards", () => expect(getPlayersOnField(0, 0, 15)).toBe(15));
  it("1 yellow (prison) → 14 players", () => expect(getPlayersOnField(1, 0, 15)).toBe(14));
  it("1 red (expelled) → 14 players", () => expect(getPlayersOnField(0, 1, 15)).toBe(14));
  it("2 yellows + 1 red → 12 players", () => expect(getPlayersOnField(2, 1, 15)).toBe(12));
  it("never below 0", () => expect(getPlayersOnField(10, 10, 15)).toBe(0));
});
