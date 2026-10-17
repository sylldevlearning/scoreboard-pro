export type Team = "A" | "B";

/** Adds points or applies an eraser correction. Negative scores are allowed on purpose. */
export const applyScoreDelta = (score: number, delta: number): number => score + delta;

export const otherTeam = (team: Team): Team => (team === "A" ? "B" : "A");
