const handleScore = (score: number, delta: number) => Math.max(0, score + delta);

describe("Basketball scoring", () => {
  it("+1 lancer franc", () => expect(handleScore(0, 1)).toBe(1));
  it("+2 panier intérieur", () => expect(handleScore(0, 2)).toBe(2));
  it("+3 tir à 3 points", () => expect(handleScore(0, 3)).toBe(3));
  it("score cannot go below 0", () => expect(handleScore(0, -1)).toBe(0));
  it("eraser subtracts 1", () => expect(handleScore(8, -1)).toBe(7));
  it("realistic first quarter: 3+2+1+3+2 = 11", () => {
    let score = 0;
    [3, 2, 1, 3, 2].forEach((pts) => { score = handleScore(score, pts); });
    expect(score).toBe(11);
  });
});
