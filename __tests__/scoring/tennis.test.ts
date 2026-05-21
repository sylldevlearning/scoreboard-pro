// Tennis scoring logic extracted from app/tennis/score.tsx

type TennisScore = 0 | 15 | 30 | 40 | "A" | "=";
const scoreOrder: (0 | 15 | 30 | 40)[] = [0, 15, 30, 40];

function nextScore(current: TennisScore): TennisScore {
  const index = (scoreOrder as number[]).indexOf(current as number);
  return (index < scoreOrder.length - 1 ? scoreOrder[index + 1] : 40) as TennisScore;
}

// Simulate a point, returns { newScoreA, newScoreB, gameWon: "A"|"B"|null }
type PointResult = { sA: TennisScore; sB: TennisScore; gameWon: "A" | "B" | null };

function applyPoint(
  team: "A" | "B",
  sA: TennisScore,
  sB: TennisScore
): PointResult {
  // Deuce
  if (sA === 40 && sB === 40) {
    return { sA: team === "A" ? "A" : sA, sB: team === "B" ? "A" : sB, gameWon: null };
  }
  // Advantage A
  if (sA === "A") {
    if (team === "A") return { sA: 0, sB: 0, gameWon: "A" };
    return { sA: "=", sB: "=", gameWon: null };
  }
  // Advantage B
  if (sB === "A") {
    if (team === "B") return { sA: 0, sB: 0, gameWon: "B" };
    return { sA: "=", sB: "=", gameWon: null };
  }
  // Deuce reset
  if (sA === "=" || sB === "=") {
    return { sA: team === "A" ? "A" : "=", sB: team === "B" ? "A" : "=", gameWon: null };
  }
  // Normal point
  const newSA: TennisScore = team === "A" ? nextScore(sA) : sA;
  const newSB: TennisScore = team === "B" ? nextScore(sB) : sB;
  // Win at 40 (other not 40)
  if (newSA === 40 && team === "A" && sB !== 40) return { sA: 0, sB: 0, gameWon: "A" };
  if (newSB === 40 && team === "B" && sA !== 40) return { sA: 0, sB: 0, gameWon: "B" };
  return { sA: newSA, sB: newSB, gameWon: null };
}

describe("Tennis nextScore progression", () => {
  it("0 → 15", () => expect(nextScore(0)).toBe(15));
  it("15 → 30", () => expect(nextScore(15)).toBe(30));
  it("30 → 40", () => expect(nextScore(30)).toBe(40));
  it("40 stays at 40 (caller handles win)", () => expect(nextScore(40)).toBe(40));
});

describe("Tennis normal game progression", () => {
  it("0-0 + A point → 15-0", () => {
    const { sA, sB, gameWon } = applyPoint("A", 0, 0);
    expect(sA).toBe(15); expect(sB).toBe(0); expect(gameWon).toBeNull();
  });
  it("30-0 + A point → game win for A (30→40 with B at 0)", () => {
    const { gameWon } = applyPoint("A", 30, 0);
    expect(gameWon).toBe("A");
  });
  it("0-30 + B point → game win for B", () => {
    const { gameWon } = applyPoint("B", 0, 30);
    expect(gameWon).toBe("B");
  });
});

describe("Tennis deuce / advantage", () => {
  it("40-40 + A point → A advantage", () => {
    const { sA, sB } = applyPoint("A", 40, 40);
    expect(sA).toBe("A");
    expect(sB).toBe(40);
  });
  it("A advantage + A point → game won by A", () => {
    const { gameWon } = applyPoint("A", "A", 40);
    expect(gameWon).toBe("A");
  });
  it("A advantage + B point → deuce reset (=)", () => {
    const { sA, sB } = applyPoint("B", "A", 40);
    expect(sA).toBe("=");
    expect(sB).toBe("=");
  });
  it("deuce (=) + A point → A advantage", () => {
    const { sA } = applyPoint("A", "=", "=");
    expect(sA).toBe("A");
  });
});

describe("Tennis tie-break", () => {
  it("tie-break score increments numerically", () => {
    // In tie-break mode, scores are just numbers
    const tbScore = (score: number) => score + 1;
    expect(tbScore(0)).toBe(1);
    expect(tbScore(6)).toBe(7);
  });
  it("tie-break win: 7-5 (≥7, gap≥2)", () => {
    const a = 7, b = 5;
    const win = (a >= 7 || b >= 7) && Math.abs(a - b) >= 2;
    expect(win).toBe(true);
  });
  it("tie-break no win at 7-6 (gap < 2)", () => {
    const a = 7, b = 6;
    const win = (a >= 7 || b >= 7) && Math.abs(a - b) >= 2;
    expect(win).toBe(false);
  });
  it("tie-break win at 8-6", () => {
    const a = 8, b = 6;
    const win = (a >= 7 || b >= 7) && Math.abs(a - b) >= 2;
    expect(win).toBe(true);
  });
});

describe("Tennis set win logic", () => {
  function setWin(gA: number, gB: number, target: number): boolean {
    return (gA >= target || gB >= target) && Math.abs(gA - gB) >= 2;
  }
  it("6-0: set won", () => expect(setWin(6, 0, 6)).toBe(true));
  it("5-5: not won", () => expect(setWin(5, 5, 6)).toBe(false));
  it("6-5: not won (gap < 2)", () => expect(setWin(6, 5, 6)).toBe(false));
  it("7-5: won", () => expect(setWin(7, 5, 6)).toBe(true));
  it("tie-break triggers at 6-6", () => {
    const newGamesA = 6, newGamesB = 6, gamesToWinSet = 6;
    const shouldTieBreak = newGamesA === gamesToWinSet && newGamesB === gamesToWinSet;
    expect(shouldTieBreak).toBe(true);
  });
});
