import { useState, useEffect, useCallback } from "react";

export type Card = {
  id: string;
  team: "A" | "B";
  cardType: string;
  timestamp: number;
  penaltySeconds?: number;
  remainingSeconds?: number;
  expired: boolean;
};

export type CardTypeConfig = {
  type: string;
  label: string;
  emoji: string;
  color: string;
  penaltySeconds?: number;
};

type UseCardManager = {
  cards: Card[];
  addCard: (team: "A" | "B", cardType: string, penaltySeconds?: number) => void;
  removeCard: (id: string) => void;
  resetCards: () => void;
  getCardCount: (team: "A" | "B", cardType: string) => number;
  getActivePenalties: (team: "A" | "B") => Card[];
  getPlayersOnField: (team: "A" | "B", maxPlayers: number) => number;
};

export function useCardManager(isMatchRunning: boolean = true): UseCardManager {
  const [cards, setCards] = useState<Card[]>([]);

  // Tick penalty timers only when match is running
  useEffect(() => {
    if (!isMatchRunning) return;
    const interval = setInterval(() => {
      setCards((prev) => {
        const hasActive = prev.some(
          (c) => !c.expired && c.remainingSeconds !== undefined && c.remainingSeconds > 0
        );
        if (!hasActive) return prev;
        return prev.map((card) => {
          if (card.expired || card.remainingSeconds === undefined || card.remainingSeconds <= 0)
            return card;
          const next = card.remainingSeconds - 1;
          return { ...card, remainingSeconds: Math.max(0, next), expired: next <= 0 };
        });
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isMatchRunning]);

  const addCard = useCallback(
    (team: "A" | "B", cardType: string, penaltySeconds?: number) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setCards((prev) => [
        ...prev,
        {
          id,
          team,
          cardType,
          timestamp: Date.now(),
          penaltySeconds,
          remainingSeconds: penaltySeconds,
          expired: false,
        },
      ]);
    },
    []
  );

  const removeCard = useCallback(
    (id: string) => setCards((prev) => prev.filter((c) => c.id !== id)),
    []
  );

  const resetCards = useCallback(() => setCards([]), []);

  const getCardCount = useCallback(
    (team: "A" | "B", cardType: string) =>
      cards.filter((c) => c.team === team && c.cardType === cardType).length,
    [cards]
  );

  const getActivePenalties = useCallback(
    (team: "A" | "B") =>
      cards.filter((c) => c.team === team && !c.expired && c.remainingSeconds !== undefined),
    [cards]
  );

  const getPlayersOnField = useCallback(
    (team: "A" | "B", maxPlayers: number) => {
      const inPrison = cards.filter(
        (c) => c.team === team && !c.expired && c.remainingSeconds !== undefined
      ).length;
      const expelled = cards.filter((c) => c.team === team && c.cardType === "red").length;
      return Math.max(0, maxPlayers - inPrison - expelled);
    },
    [cards]
  );

  return {
    cards,
    addCard,
    removeCard,
    resetCards,
    getCardCount,
    getActivePenalties,
    getPlayersOnField,
  };
}
