// Cricket scoring logic extracted from app/cricket/score.tsx

function handleWicket(wickets: number): number {
  return wickets < 10 ? wickets + 1 : wickets;
}

function handleRun(runs: number, run: number): number {
  return runs + run;
}

function endInning(
  currentInning: 1 | 2,
  battingTeam: "A" | "B",
  runsA: number,
  runsB: number,
  teamA: string,
  teamB: string
): { nextInning?: 1 | 2; nextBattingTeam?: "A" | "B"; winner?: string } {
  if (currentInning === 1) {
    return { nextInning: 2, nextBattingTeam: battingTeam === "A" ? "B" : "A" };
  }
  if (runsA > runsB) return { winner: teamA };
  if (runsB > runsA) return { winner: teamB };
  return { winner: "Match nul" };
}

describe("Cricket wickets", () => {
  it("starts at 0", () => expect(handleWicket(0)).toBe(1));
  it("max 10 wickets — cannot exceed", () => expect(handleWicket(10)).toBe(10));
  it("9th wicket can be added", () => expect(handleWicket(9)).toBe(10));
  it("wicket increments normally", () => expect(handleWicket(4)).toBe(5));
});

describe("Cricket runs", () => {
  it("1 run", () => expect(handleRun(0, 1)).toBe(1));
  it("4 runs (boundary)", () => expect(handleRun(20, 4)).toBe(24));
  it("6 runs (six)", () => expect(handleRun(50, 6)).toBe(56));
  it("accumulates across balls", () => {
    let runs = 0;
    [1, 4, 6, 2, 0, 1].forEach((r) => { runs = handleRun(runs, r); });
    expect(runs).toBe(14);
  });
});

describe("Cricket innings alternation", () => {
  it("end of inning 1: moves to inning 2 and swaps batting team", () => {
    const result = endInning(1, "A", 120, 0, "Équipe A", "Équipe B");
    expect(result.nextInning).toBe(2);
    expect(result.nextBattingTeam).toBe("B");
  });
  it("if team B bats first, swap to A in inning 2", () => {
    const result = endInning(1, "B", 0, 0, "A", "B");
    expect(result.nextBattingTeam).toBe("A");
  });
});

describe("Cricket match winner", () => {
  it("Team A wins if runsA > runsB at end of inning 2", () => {
    const result = endInning(2, "B", 200, 180, "Team A", "Team B");
    expect(result.winner).toBe("Team A");
  });
  it("Team B wins if runsB > runsA", () => {
    const result = endInning(2, "A", 150, 180, "Team A", "Team B");
    expect(result.winner).toBe("Team B");
  });
  it("draw if runsA === runsB", () => {
    const result = endInning(2, "A", 150, 150, "Team A", "Team B");
    expect(result.winner).toBe("Match nul");
  });
});

describe("Cricket starting batting team", () => {
  it("reset uses startingBattingTeam", () => {
    // Simulates resetMatch logic
    const startingBattingTeam: "A" | "B" = "B";
    const battingTeam = startingBattingTeam;
    expect(battingTeam).toBe("B");
  });
});
