import {
  applyPoint,
  eraseLastPoint,
  initialTennisState,
  isMatchOver,
  nextScore,
  type SnapshotEntry,
  type TennisRules,
  type TennisState,
} from "@/utils/scoring/tennis";

const RULES: TennisRules = { gamesToWinSet: 6, setsToWin: 2, tieBreakEnabled: true };

const state = (overrides?: Partial<TennisState>): TennisState => ({ ...initialTennisState, ...overrides });

/** Plays a sequence of points ("AABA…") from `start`. */
const play = (points: string, start: TennisState = initialTennisState, rules: TennisRules = RULES) =>
  [...points].reduce((s, p) => applyPoint(s, p as "A" | "B", rules), start);

/** Points for `team` to win one game from 0-0. */
const game = (team: "A" | "B") => team.repeat(4);

describe("Tennis nextScore progression", () => {
  it("0 → 15", () => expect(nextScore(0)).toBe(15));
  it("15 → 30", () => expect(nextScore(15)).toBe(30));
  it("30 → 40", () => expect(nextScore(30)).toBe(40));
  it("40 stays at 40 (caller handles win)", () => expect(nextScore(40)).toBe(40));
});

describe("Tennis normal game progression", () => {
  it("0-0 + A point → 15-0", () => {
    const s = play("A");
    expect(s.scoreA).toBe(15);
    expect(s.scoreB).toBe(0);
    expect(s.gamesA).toBe(0);
  });
  it("30-0 + A point → 40-0, game not won yet", () => {
    const s = play("AAA");
    expect(s.scoreA).toBe(40);
    expect(s.gamesA).toBe(0);
  });
  it("40-0 + A point → game for A, points reset", () => {
    const s = play("AAAA");
    expect(s.gamesA).toBe(1);
    expect(s.scoreA).toBe(0);
    expect(s.scoreB).toBe(0);
  });
  it("0-40 + B point → game for B", () => {
    expect(play("BBBB").gamesB).toBe(1);
  });
});

describe("Tennis deuce / advantage", () => {
  const deuce = "AAABBB"; // 40-40

  it("40-40 + A point → A advantage", () => {
    const s = play(deuce + "A");
    expect(s.scoreA).toBe("A");
    expect(s.scoreB).toBe(40);
  });
  it("A advantage + A point → game won by A", () => {
    expect(play(deuce + "AA").gamesA).toBe(1);
  });
  it("A advantage + B point → deuce reset (=)", () => {
    const s = play(deuce + "AB");
    expect(s.scoreA).toBe("=");
    expect(s.scoreB).toBe("=");
  });
  it("deuce (=) + A point → A advantage", () => {
    expect(play(deuce + "ABA").scoreA).toBe("A");
  });
  it("long deuce: A wins after several advantages", () => {
    const s = play(deuce + "AB" + "BA" + "AA");
    expect(s.gamesA).toBe(1);
    expect(s.gamesB).toBe(0);
  });
});

describe("Tennis set win logic", () => {
  it("6-0: set won, games reset, history recorded", () => {
    const s = play(game("A").repeat(6));
    expect(s.setsA).toBe(1);
    expect(s.gamesA).toBe(0);
    expect(s.setsHistory).toEqual([[6, 0]]);
  });
  it("6-5: not won (gap < 2)", () => {
    const s = play("", state({ gamesA: 5, gamesB: 5 }));
    const after = play(game("A"), s);
    expect(after.gamesA).toBe(6);
    expect(after.setsA).toBe(0);
  });
  it("7-5: won", () => {
    const s = play(game("A"), state({ gamesA: 6, gamesB: 5 }));
    expect(s.setsA).toBe(1);
    expect(s.setsHistory).toEqual([[7, 5]]);
  });
  it("tie-break triggers at 6-6", () => {
    const s = play(game("B"), state({ gamesA: 6, gamesB: 5 }));
    expect(s.isTieBreak).toBe(true);
    expect(s.gamesA).toBe(6);
    expect(s.gamesB).toBe(6);
  });
  it("tie-break disabled: 6-6 plays on until a 2-game lead", () => {
    const rules = { ...RULES, tieBreakEnabled: false };
    let s = play(game("B"), state({ gamesA: 6, gamesB: 5 }), rules);
    expect(s.isTieBreak).toBe(false);
    s = play(game("A") + game("A"), s, rules);
    expect(s.setsHistory).toEqual([[8, 6]]);
  });
});

describe("Tennis tie-break", () => {
  const tieBreak = state({ gamesA: 6, gamesB: 6, isTieBreak: true });

  it("tie-break score increments numerically", () => {
    expect(play("A", tieBreak).scoreA).toBe(1);
  });
  it("tie-break win at 7-5 ends the set 7-6", () => {
    const s = play("AAAAABBBBBAA", tieBreak);
    expect(s.isTieBreak).toBe(false);
    expect(s.setsA).toBe(1);
    expect(s.setsHistory).toEqual([[7, 6]]);
  });
  it("no win at 7-6 (gap < 2)", () => {
    const s = play("AAAAAABBBBBBA", tieBreak);
    expect(s.scoreA).toBe(7);
    expect(s.scoreB).toBe(6);
    expect(s.isTieBreak).toBe(true);
  });
  it("win at 8-6", () => {
    const s = play("AAAAAABBBBBBAA", tieBreak);
    expect(s.setsA).toBe(1);
  });
});

describe("Tennis match end", () => {
  it("2 sets won → match winner A", () => {
    const s = play(game("A").repeat(12));
    expect(s.setsA).toBe(2);
    expect(s.matchWinner).toBe("A");
    expect(isMatchOver(s, RULES)).toBe(true);
  });
  it("points after the match is over are ignored", () => {
    const over = play(game("A").repeat(12));
    expect(play("BBBB", over)).toBe(over);
  });
  it("best of 5 (3 sets): 2-1 is not over", () => {
    const rules = { ...RULES, setsToWin: 3 };
    const s = state({ setsA: 2, setsB: 1 });
    expect(isMatchOver(s, rules)).toBe(false);
    expect(play(game("B"), s, rules).matchWinner).toBeNull();
  });
});

// --- Eraser (snapshot stack) ---

const entry = (by: "A" | "B", overrides?: Partial<TennisState>): SnapshotEntry => ({ by, state: state(overrides) });

describe("Tennis eraser A — 3 pressions", () => {
  it("erase A 3 times → each erase restores one A-point back", () => {
    let stack: SnapshotEntry[] = [entry("A", { scoreA: 0 }), entry("A", { scoreA: 15 }), entry("A", { scoreA: 30 })];
    let r = eraseLastPoint(stack, "A");
    stack = r.stack;
    expect(r.state?.scoreA).toBe(30);

    r = eraseLastPoint(stack, "A");
    stack = r.stack;
    expect(r.state?.scoreA).toBe(15);

    r = eraseLastPoint(stack, "A");
    stack = r.stack;
    expect(r.state?.scoreA).toBe(0);
    expect(stack).toHaveLength(0);
  });
});

describe("Tennis eraser B — 3 pressions", () => {
  it("erase B 3 times → each erase restores one B-point back", () => {
    let stack: SnapshotEntry[] = [entry("B", { scoreB: 0 }), entry("B", { scoreB: 15 }), entry("B", { scoreB: 30 })];
    let r = eraseLastPoint(stack, "B");
    stack = r.stack;
    expect(r.state?.scoreB).toBe(30);

    r = eraseLastPoint(stack, "B");
    stack = r.stack;
    expect(r.state?.scoreB).toBe(15);

    r = eraseLastPoint(stack, "B");
    stack = r.stack;
    expect(r.state?.scoreB).toBe(0);
    expect(stack).toHaveLength(0);
  });
});

describe("Tennis eraser A n'affecte pas B", () => {
  it("A,B sequence — erase B restores state before B, A entry stays", () => {
    const stack = [entry("A", { scoreA: 0 }), entry("B", { scoreA: 15, scoreB: 0 })];
    const { state: s, stack: newStack } = eraseLastPoint(stack, "B");
    expect(s?.scoreA).toBe(15);
    expect(s?.scoreB).toBe(0);
    expect(newStack).toHaveLength(1);
    expect(newStack[0].by).toBe("A");
  });

  it("erase A does not modify B's remaining snapshot", () => {
    const stack = [entry("B", { scoreB: 0 }), entry("A", { scoreA: 0, scoreB: 15 })];
    const { state: s, stack: newStack } = eraseLastPoint(stack, "A");
    expect(s?.scoreB).toBe(15);
    expect(newStack).toHaveLength(1);
    expect(newStack[0].by).toBe("B");
  });
});

describe("Tennis eraser alternance", () => {
  it("A,B,A — erase A → restores to before last A (B's point stays in stack)", () => {
    const stack = [entry("A", { scoreA: 0 }), entry("B", { scoreA: 15 }), entry("A", { scoreA: 15, scoreB: 15 })];
    const { state: s, stack: newStack } = eraseLastPoint(stack, "A");
    expect(s?.scoreA).toBe(15);
    expect(s?.scoreB).toBe(15);
    expect(newStack).toHaveLength(2);
  });

  it("no history for team → noop (null)", () => {
    expect(eraseLastPoint([], "A").state).toBeNull();
  });

  it("erasing the match-winning point reopens the match", () => {
    const beforeLast = play(game("A").repeat(11) + "AAA");
    const over = applyPoint(beforeLast, "A", RULES);
    expect(over.matchWinner).toBe("A");
    const { state: s } = eraseLastPoint([{ by: "A", state: beforeLast }], "A");
    expect(s?.matchWinner).toBeNull();
    expect(isMatchOver(s!, RULES)).toBe(false);
  });
});
