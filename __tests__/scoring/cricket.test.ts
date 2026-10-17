import {
  addWicket,
  correctWicket,
  getChaseResult,
  getFinalResult,
  MAX_WICKETS,
  nextBattingTeam,
} from "@/utils/scoring/cricket";
import { applyScoreDelta } from "@/utils/scoring/common";

describe("Cricket wickets", () => {
  it("starts at 0", () => expect(addWicket(0)).toBe(1));
  it("max 10 wickets — cannot exceed", () => expect(addWicket(MAX_WICKETS)).toBe(10));
  it("9th wicket can be added", () => expect(addWicket(9)).toBe(10));
  it("wicket increments normally", () => expect(addWicket(4)).toBe(5));
});

describe("Cricket runs", () => {
  it("1 run", () => expect(applyScoreDelta(0, 1)).toBe(1));
  it("4 runs (boundary)", () => expect(applyScoreDelta(20, 4)).toBe(24));
  it("6 runs (six)", () => expect(applyScoreDelta(50, 6)).toBe(56));
  it("accumulates across balls", () => {
    const runs = [1, 4, 6, 2, 0, 1].reduce(applyScoreDelta, 0);
    expect(runs).toBe(14);
  });
});

describe("Cricket innings alternation", () => {
  it("end of inning 1: team A batting → B bats in inning 2", () => {
    expect(nextBattingTeam("A")).toBe("B");
  });
  it("if team B bats first, swap to A in inning 2", () => {
    expect(nextBattingTeam("B")).toBe("A");
  });
});

describe("Cricket match winner (innings ended manually)", () => {
  it("A wins if runsA > runsB", () => expect(getFinalResult(200, 180)).toBe("A"));
  it("B wins if runsB > runsA", () => expect(getFinalResult(150, 180)).toBe("B"));
  it("draw if runsA === runsB", () => expect(getFinalResult(150, 150)).toBe("draw"));
});

describe("Cricket automatic end of the chase (2nd innings)", () => {
  it("chase still on below the target", () => {
    expect(getChaseResult(150, 3, 180, "B")).toBeNull();
  });
  it("equal to the target is not a win yet", () => {
    expect(getChaseResult(180, 3, 180, "B")).toBeNull();
  });
  it("chasing team wins as soon as it passes the target", () => {
    expect(getChaseResult(181, 3, 180, "B")).toEqual({ winner: "B" });
  });
  it("chasing team all out below the target → defending team wins", () => {
    expect(getChaseResult(150, 10, 180, "B")).toEqual({ winner: "A" });
  });
  it("all out on equal runs → draw", () => {
    expect(getChaseResult(180, 10, 180, "A")).toEqual({ winner: "draw" });
  });
  it("passing the target on the last wicket still wins", () => {
    expect(getChaseResult(181, 10, 180, "A")).toEqual({ winner: "A" });
  });
});

describe("Cricket score corrections", () => {
  it("correction run: 15 → 14", () => expect(applyScoreDelta(15, -1)).toBe(14));
  it("correction run can go negative", () => expect(applyScoreDelta(0, -1)).toBe(-1));
  it("correction run 5 times from 0 → -5", () => {
    let runs = 0;
    for (let i = 0; i < 5; i++) runs = applyScoreDelta(runs, -1);
    expect(runs).toBe(-5);
  });
  it("correction wicket: 3 → 2", () => expect(correctWicket(3)).toBe(2));
  it("correction wicket minimum is 0", () => expect(correctWicket(0)).toBe(0));
  it("correction over: 5 → 4", () => expect(applyScoreDelta(5, -1)).toBe(4));
  it("correction over can go negative", () => expect(applyScoreDelta(0, -1)).toBe(-1));
  it("sequence: +6 then correction → 5", () => {
    expect(applyScoreDelta(applyScoreDelta(0, 6), -1)).toBe(5);
  });
});
