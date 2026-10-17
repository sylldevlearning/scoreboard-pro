import { HOCKEY_PENALTY_TYPES } from "@/components/HockeyPenaltyButtons";
import { applyScoreDelta } from "@/utils/scoring/common";
import {
  canGoNextPeriod,
  getStrength,
  isPenaltyUrgent,
  nextPeriod,
  playersOnIce,
} from "@/utils/scoring/hockey";

type TestCard = { team: "A" | "B"; cardType: string; expired: boolean; remainingSeconds?: number };
const penalty = (team: "A" | "B", cardType = "minor", expired = false): TestCard => ({
  team, cardType, expired, remainingSeconds: cardType === "match" ? undefined : 120,
});

describe("Hockey scoring", () => {
  it("+1 goal", () => expect(applyScoreDelta(0, 1)).toBe(1));
  it("-1 correction", () => expect(applyScoreDelta(3, -1)).toBe(2));
  it("eraser can make score negative", () => expect(applyScoreDelta(0, -1)).toBe(-1));
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
  it("equal penalties → no superiority", () => {
    expect(getStrength([], "A")).toBe("equal");
    expect(getStrength([penalty("A"), penalty("B")], "B")).toBe("equal");
  });
  it("A has 2 penalties, B has 0 → A in inferiority, B in superiority", () => {
    const cards = [penalty("A"), penalty("A", "major")];
    expect(getStrength(cards, "A")).toBe("inferiority");
    expect(getStrength(cards, "B")).toBe("superiority");
  });
  it("B has 1 penalty → B in inferiority", () => {
    expect(getStrength([penalty("B")], "B")).toBe("inferiority");
  });
  it("expired penalties don't count", () => {
    expect(getStrength([penalty("A", "minor", true)], "A")).toBe("equal");
  });
});

describe("Hockey penalty types", () => {
  const seconds = (type: string) => HOCKEY_PENALTY_TYPES.find((p) => p.type === type)?.seconds;
  it("has 4 penalty types", () => expect(HOCKEY_PENALTY_TYPES).toHaveLength(4));
  it("minor = 120s", () => expect(seconds("minor")).toBe(120));
  it("major = 300s", () => expect(seconds("major")).toBe(300));
  it("misconduct = 600s", () => expect(seconds("misconduct")).toBe(600));
  it("match penalty has no timer", () => expect(seconds("match")).toBeUndefined());
});

describe("Hockey players on ice", () => {
  it("5 players with no penalties", () => expect(playersOnIce([], "A")).toBe(5));
  it("4 players with 1 active timed penalty", () => {
    expect(playersOnIce([penalty("A")], "A")).toBe(4);
  });
  it("3 players with 2 active timed penalties", () => {
    expect(playersOnIce([penalty("A"), penalty("A", "major")], "A")).toBe(3);
  });
  it("minimum 3 players with 3+ penalties", () => {
    const cards = [penalty("A"), penalty("A", "major"), penalty("A", "misconduct")];
    expect(playersOnIce(cards, "A")).toBe(3);
  });
  it("expired penalty does not reduce count", () => {
    expect(playersOnIce([penalty("A", "minor", true)], "A")).toBe(5);
  });
  it("match penalty reduces count by 1", () => {
    expect(playersOnIce([penalty("A", "match")], "A")).toBe(4);
  });
  it("other team's penalty does not affect this team", () => {
    expect(playersOnIce([penalty("B")], "A")).toBe(5);
  });
});

describe("Hockey penalty urgency (≤30s)", () => {
  it("31s is not urgent", () => expect(isPenaltyUrgent(31)).toBe(false));
  it("30s is urgent", () => expect(isPenaltyUrgent(30)).toBe(true));
  it("0s is urgent", () => expect(isPenaltyUrgent(0)).toBe(true));
});
