// Hockey scoring logic extracted from app/hockey/score.tsx

const handleScore = (score: number, delta: number) => Math.max(0, score + delta);

type Period = 1 | 2 | 3 | "OT";

function nextPeriod(current: Period, scoreA: number, scoreB: number): Period | null {
  if (current === "OT") return null;
  if (current === 1) return 2;
  if (current === 2) return 3;
  // Period 3 → OT only if tied
  if (current === 3) {
    if (scoreA === scoreB) return "OT";
    return null; // game over
  }
  return null;
}

function canGoNextPeriod(current: Period, scoreA: number, scoreB: number): boolean {
  if (current === "OT") return false;
  if (current === 3 && scoreA !== scoreB) return false;
  return true;
}

describe("Hockey scoring", () => {
  it("+1 goal", () => expect(handleScore(0, 1)).toBe(1));
  it("-1 correction", () => expect(handleScore(3, -1)).toBe(2));
  it("score cannot go below 0", () => expect(handleScore(0, -1)).toBe(0));
});

describe("Hockey period progression", () => {
  it("Period 1 → 2", () => expect(nextPeriod(1, 0, 0)).toBe(2));
  it("Period 2 → 3", () => expect(nextPeriod(2, 0, 0)).toBe(3));
  it("Period 3 tied → OT", () => expect(nextPeriod(3, 2, 2)).toBe("OT"));
  it("Period 3 not tied → game over (null)", () => expect(nextPeriod(3, 3, 2)).toBeNull());
  it("OT → no next period", () => expect(nextPeriod("OT", 2, 2)).toBeNull());
});

describe("Hockey canGoNextPeriod", () => {
  it("true from period 1", () => expect(canGoNextPeriod(1, 0, 0)).toBe(true));
  it("true from period 2", () => expect(canGoNextPeriod(2, 1, 1)).toBe(true));
  it("true from period 3 if tied", () => expect(canGoNextPeriod(3, 2, 2)).toBe(true));
  it("false from period 3 if not tied", () => expect(canGoNextPeriod(3, 3, 2)).toBe(false));
  it("false from OT", () => expect(canGoNextPeriod("OT", 3, 3)).toBe(false));
});

describe("Hockey superiority/inferiority", () => {
  // Team A has more active penalties → infériority for A, supériorité for B
  function getSuperiorityState(penaltiesA: number, penaltiesB: number) {
    if (penaltiesA > penaltiesB) return { A: "inferiority", B: "superiority" };
    if (penaltiesB > penaltiesA) return { A: "superiority", B: "inferiority" };
    return { A: "equal", B: "equal" };
  }
  it("equal penalties → no superiority", () => {
    expect(getSuperiorityState(0, 0).A).toBe("equal");
  });
  it("A has 2 penalties, B has 0 → A in inferiority", () => {
    expect(getSuperiorityState(2, 0).A).toBe("inferiority");
    expect(getSuperiorityState(2, 0).B).toBe("superiority");
  });
  it("B has 1 penalty → B in inferiority", () => {
    expect(getSuperiorityState(0, 1).B).toBe("inferiority");
  });
});
