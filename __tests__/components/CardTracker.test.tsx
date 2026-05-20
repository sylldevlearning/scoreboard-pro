import React from "react";
import { render } from "@testing-library/react-native";
import CardTracker from "@/components/CardTracker";
import type { Card, CardTypeConfig } from "@/hooks/useCardManager";

const CARD_TYPES: CardTypeConfig[] = [
  { type: "yellow", label: "Carton jaune", emoji: "🟨", color: "#f1c40f" },
  { type: "red", label: "Carton rouge", emoji: "🟥", color: "#e74c3c" },
];

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: `card-${Math.random()}`,
    team: "A",
    cardType: "yellow",
    timestamp: Date.now(),
    expired: false,
    ...overrides,
  };
}

describe("<CardTracker>", () => {
  it("renders nothing when no cards for the team", () => {
    const { toJSON } = render(
      <CardTracker team="A" cards={[]} cardTypes={CARD_TYPES} />
    );
    expect(toJSON()).toBeNull();
  });

  it("renders nothing when only the other team has cards", () => {
    const cards = [makeCard({ team: "B", cardType: "yellow" })];
    const { toJSON } = render(
      <CardTracker team="A" cards={cards} cardTypes={CARD_TYPES} />
    );
    expect(toJSON()).toBeNull();
  });

  it("displays badge emoji for a yellow card", () => {
    const cards = [makeCard({ team: "A", cardType: "yellow" })];
    const { getByText } = render(
      <CardTracker team="A" cards={cards} cardTypes={CARD_TYPES} />
    );
    expect(getByText("🟨")).toBeTruthy();
  });

  it("shows ×N suffix when multiple cards of same type", () => {
    const cards = [
      makeCard({ team: "A", cardType: "yellow" }),
      makeCard({ team: "A", cardType: "yellow" }),
    ];
    const { getByText } = render(
      <CardTracker team="A" cards={cards} cardTypes={CARD_TYPES} />
    );
    expect(getByText("🟨×2")).toBeTruthy();
  });

  it("no ×N shown for single card", () => {
    const cards = [makeCard({ team: "A", cardType: "red" })];
    const { queryByText } = render(
      <CardTracker team="A" cards={cards} cardTypes={CARD_TYPES} />
    );
    expect(queryByText(/×/)).toBeNull();
  });

  it("displays active penalty timer in MM:SS format", () => {
    const cards = [makeCard({ team: "A", cardType: "yellow", remainingSeconds: 272 })];
    const { getByText } = render(
      <CardTracker team="A" cards={cards} cardTypes={CARD_TYPES} />
    );
    // 272 seconds = 04:32
    expect(getByText("🟨 04:32")).toBeTruthy();
  });

  it("does NOT display expired penalty timer", () => {
    const cards = [
      makeCard({ team: "A", cardType: "yellow", remainingSeconds: 0, expired: true }),
    ];
    const { queryByText } = render(
      <CardTracker team="A" cards={cards} cardTypes={CARD_TYPES} />
    );
    expect(queryByText(/04:/)).toBeNull();
    expect(queryByText(/00:00/)).toBeNull();
  });

  it("timer text is red when remainingSeconds ≤ 30 (urgent)", () => {
    const cards = [makeCard({ team: "A", cardType: "yellow", remainingSeconds: 15 })];
    const { getByText } = render(
      <CardTracker team="A" cards={cards} cardTypes={CARD_TYPES} />
    );
    const timerEl = getByText("🟨 00:15");
    expect(timerEl.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: "#ff4444" }),
      ])
    );
  });
});
