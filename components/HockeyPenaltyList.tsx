import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import type { Card } from "@/hooks/useCardManager";
import { isPenaltyUrgent } from "@/utils/scoring/hockey";

type Props = {
  team: "A" | "B";
  cards: Card[];
};

function HockeyPenaltyList({ team, cards }: Props) {
  const timedPenalties = cards.filter(
    (c) => c.team === team && !c.expired && c.remainingSeconds !== undefined
  );
  const matchPenalties = cards.filter(
    (c) => c.team === team && c.cardType === "match" && !c.expired
  );

  if (timedPenalties.length === 0 && matchPenalties.length === 0) return null;

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

  return (
    <View style={styles.container}>
      {timedPenalties.map((c) => {
        const remaining = c.remainingSeconds ?? 0;
        const urgent = isPenaltyUrgent(remaining);
        return (
          <View key={c.id} style={[styles.row, urgent && styles.rowUrgent]}>
            <Text style={[styles.time, urgent && styles.timeUrgent]}>
              {formatTime(remaining)}
            </Text>
          </View>
        );
      })}
      {matchPenalties.map((c) => (
        <View key={c.id} style={styles.matchRow}>
          <Text style={styles.matchText}>⛔ Expulsion</Text>
        </View>
      ))}
    </View>
  );
}

export default memo(HockeyPenaltyList);

const styles = StyleSheet.create({
  container: { gap: 4, alignItems: "center" },
  row: {
    backgroundColor: "#1a3a7a",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 60,
    alignItems: "center",
  },
  rowUrgent: { backgroundColor: "#7a1a1a" },
  time: { color: "#fff", fontSize: 15, fontWeight: "bold", fontVariant: ["tabular-nums"] },
  timeUrgent: { color: "#ff6b6b" },
  matchRow: {
    backgroundColor: "#5a0000",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  matchText: { color: "#fff", fontSize: 13, fontWeight: "bold" },
});
