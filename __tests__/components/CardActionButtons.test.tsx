import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import CardActionButtons from "@/components/CardActionButtons";
import type { CardTypeConfig } from "@/hooks/useCardManager";

const CARD_TYPES: CardTypeConfig[] = [
  { type: "yellow", label: "Carton jaune", emoji: "🟨", color: "#f1c40f" },
  { type: "red", label: "Carton rouge (expulsion)", emoji: "🟥", color: "#e74c3c" },
];

describe("<CardActionButtons>", () => {
  it("renders the trigger button", () => {
    const { getByText } = render(
      <CardActionButtons
        team="A"
        teamName="Équipe A"
        cardTypes={CARD_TYPES}
        onAddCard={jest.fn()}
      />
    );
    expect(getByText("🟨+")).toBeTruthy();
  });

  it("modal is hidden by default", () => {
    const { queryByText } = render(
      <CardActionButtons
        team="A"
        teamName="Équipe A"
        cardTypes={CARD_TYPES}
        onAddCard={jest.fn()}
      />
    );
    expect(queryByText("Carton — Équipe A")).toBeNull();
  });

  it("pressing trigger opens the modal", () => {
    const { getByText } = render(
      <CardActionButtons
        team="A"
        teamName="Équipe A"
        cardTypes={CARD_TYPES}
        onAddCard={jest.fn()}
      />
    );
    fireEvent.press(getByText("🟨+"));
    expect(getByText("Carton — Équipe A")).toBeTruthy();
  });

  it("pressing yellow card calls onAddCard immediately", () => {
    const onAddCard = jest.fn();
    const { getByText } = render(
      <CardActionButtons
        team="A"
        teamName="Équipe A"
        cardTypes={CARD_TYPES}
        onAddCard={onAddCard}
      />
    );
    fireEvent.press(getByText("🟨+"));
    fireEvent.press(getByText("Carton jaune"));
    expect(onAddCard).toHaveBeenCalledWith("A", "yellow");
  });

  it("pressing red card shows confirmation (2-tap required)", () => {
    const onAddCard = jest.fn();
    const { getByText, queryByText } = render(
      <CardActionButtons
        team="A"
        teamName="Équipe A"
        cardTypes={CARD_TYPES}
        onAddCard={onAddCard}
      />
    );
    fireEvent.press(getByText("🟨+"));
    fireEvent.press(getByText("Carton rouge (expulsion)"));
    // 1st tap: confirmation screen shown
    expect(queryByText("Confirmer l'expulsion définitive ?", { exact: false })).toBeTruthy();
    expect(onAddCard).not.toHaveBeenCalled();
  });

  it("confirming red card calls onAddCard with red", () => {
    const onAddCard = jest.fn();
    const { getByText } = render(
      <CardActionButtons
        team="A"
        teamName="Équipe A"
        cardTypes={CARD_TYPES}
        onAddCard={onAddCard}
      />
    );
    fireEvent.press(getByText("🟨+"));
    fireEvent.press(getByText("Carton rouge (expulsion)"));
    fireEvent.press(getByText("Confirmer"));
    expect(onAddCard).toHaveBeenCalledWith("A", "red");
  });

  it("cancelling red confirmation goes back to card list", () => {
    const onAddCard = jest.fn();
    const { getByText, queryByText } = render(
      <CardActionButtons
        team="A"
        teamName="Équipe A"
        cardTypes={CARD_TYPES}
        onAddCard={onAddCard}
      />
    );
    fireEvent.press(getByText("🟨+"));
    fireEvent.press(getByText("Carton rouge (expulsion)"));
    fireEvent.press(getByText("Annuler"));
    expect(onAddCard).not.toHaveBeenCalled();
    // Card list should be back
    expect(queryByText("Carton jaune")).toBeTruthy();
  });

  it("Fermer button closes the modal", () => {
    const { getByText, queryByText } = render(
      <CardActionButtons
        team="B"
        teamName="Équipe B"
        cardTypes={CARD_TYPES}
        onAddCard={jest.fn()}
      />
    );
    fireEvent.press(getByText("🟨+"));
    expect(getByText("Carton — Équipe B")).toBeTruthy();
    fireEvent.press(getByText("Fermer"));
    expect(queryByText("Carton — Équipe B")).toBeNull();
  });
});
