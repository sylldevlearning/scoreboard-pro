const handleScore = (score: number, delta: number) => Math.max(0, score + delta);

describe("Rugby scoring", () => {
  it("+2 transformation", () => expect(handleScore(5, 2)).toBe(7));
  it("+3 pénalité/drop", () => expect(handleScore(0, 3)).toBe(3));
  it("+5 essai", () => expect(handleScore(7, 5)).toBe(12));
  it("score cannot go below 0", () => expect(handleScore(0, -1)).toBe(0));
  it("eraser works on any positive score", () => expect(handleScore(12, -1)).toBe(11));
  it("typical sequence: essai (5) + transformation (2) = 7", () => {
    let score = 0;
    score = handleScore(score, 5);
    score = handleScore(score, 2);
    expect(score).toBe(7);
  });
  it("typical match: 3 essais + 3 transfo + 1 drop = 24", () => {
    let score = 0;
    score = handleScore(score, 5); // essai 1
    score = handleScore(score, 2); // transfo 1
    score = handleScore(score, 5); // essai 2
    score = handleScore(score, 2); // transfo 2
    score = handleScore(score, 5); // essai 3
    score = handleScore(score, 2); // transfo 3
    score = handleScore(score, 3); // drop
    expect(score).toBe(24);
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
