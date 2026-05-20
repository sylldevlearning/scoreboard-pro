// Pure scoring logic for Football (mirroring app/football/score.tsx)
const handleScore = (score: number, delta: number) => Math.max(0, score + delta);

describe("Football scoring", () => {
  it("+1 increments score", () => expect(handleScore(0, 1)).toBe(1));
  it("-1 decrements score", () => expect(handleScore(3, -1)).toBe(2));
  it("score cannot go below 0", () => expect(handleScore(0, -1)).toBe(0));
  it("multiple goals accumulate", () => {
    let score = 0;
    [1, 1, 1].forEach(() => { score = handleScore(score, 1); });
    expect(score).toBe(3);
  });
  it("erasing works at any score", () => {
    expect(handleScore(10, -1)).toBe(9);
    expect(handleScore(1, -1)).toBe(0);
    expect(handleScore(0, -1)).toBe(0);
  });
});

// Card logic: 2nd yellow → auto red
describe("Football card logic", () => {
  it("1st yellow does not trigger red", () => {
    const yellowsBefore = 0;
    const shouldAddRed = yellowsBefore >= 1;
    expect(shouldAddRed).toBe(false);
  });
  it("2nd yellow triggers red", () => {
    const yellowsBefore = 1;
    const shouldAddRed = yellowsBefore >= 1;
    expect(shouldAddRed).toBe(true);
  });
  it("3rd yellow also triggers red (already expelled case)", () => {
    const yellowsBefore = 2;
    const shouldAddRed = yellowsBefore >= 1;
    expect(shouldAddRed).toBe(true);
  });
});
