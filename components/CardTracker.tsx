import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import type { Card, CardTypeConfig } from "@/hooks/useCardManager";

type Props = {
  team: "A" | "B";
  cards: Card[];
  cardTypes: CardTypeConfig[];
};

function fmt(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function CardTracker({ team, cards, cardTypes }: Props) {
  const teamCards = cards.filter((c) => c.team === team);
  const activePenalties = teamCards.filter(
    (c) => !c.expired && c.remainingSeconds !== undefined
  );

  const counts = cardTypes
    .map((ct) => ({
      ...ct,
      count: teamCards.filter((c) => c.cardType === ct.type).length,
    }))
    .filter((ct) => ct.count > 0);

  if (counts.length === 0 && activePenalties.length === 0) return null;

  return (
    <View style={styles.container}>
      {counts.length > 0 && (
        <View style={styles.badgeRow}>
          {counts.map((ct) => (
            <Text key={ct.type} style={styles.badge}>
              {ct.emoji}
              {ct.count > 1 ? `×${ct.count}` : ""}
            </Text>
          ))}
        </View>
      )}
      {activePenalties.map((card) => {
        const cfg = cardTypes.find((ct) => ct.type === card.cardType);
        const urgent = (card.remainingSeconds ?? 0) <= 30;
        return (
          <Text
            key={card.id}
            style={[styles.timer, urgent && styles.timerUrgent]}
          >
            {cfg?.emoji ?? "⚠️"} {fmt(card.remainingSeconds!)}
          </Text>
        );
      })}
    </View>
  );
}

export default memo(CardTracker);

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 2, marginVertical: 2 },
  badgeRow: { flexDirection: "row", gap: 4 },
  badge: { fontSize: 15 },
  timer: { fontSize: 15, color: "#fff", fontWeight: "bold" },
  timerUrgent: { color: "#ff4444" },
});
