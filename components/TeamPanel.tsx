import type { ReactNode } from "react";
import { View, StyleSheet } from "react-native";

type Props = {
  side: "A" | "B";
  isLandscape: boolean;
  /** Team name. */
  title: ReactNode;
  /** Small status lines under the name (players count, cards…). */
  info?: ReactNode;
  /** Shown just before the score (usually the eraser). */
  scoreAside?: ReactNode;
  score: ReactNode;
  /** Shown just after the score (sets, games…). */
  meta?: ReactNode;
  /** Scoring / card buttons. */
  actions?: ReactNode;
};

/**
 * One team's block on a score screen.
 * Portrait: everything stacked in a column (name, info, eraser, score, buttons).
 * Landscape: name on top, then score and buttons side by side — buttons on the
 * outer edge of the screen, score towards the centre like a real scoreboard.
 */
export default function TeamPanel({ side, isLandscape, title, info, scoreAside, score, meta, actions }: Props) {
  if (!isLandscape) {
    return (
      <View style={styles.portrait}>
        {title}
        {info}
        {scoreAside}
        {score}
        {meta}
        {actions}
      </View>
    );
  }

  return (
    <View style={styles.landscape}>
      <View style={styles.head}>
        {title}
        {info}
      </View>
      <View style={[styles.body, side === "A" && styles.bodyReversed]}>
        <View style={styles.scoreCol}>
          {scoreAside}
          {score}
          {meta}
        </View>
        {actions ? <View style={styles.actionsCol}>{actions}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  portrait: { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 8 },
  landscape: { flex: 1, alignSelf: "stretch", alignItems: "center", gap: 4 },
  head: { alignItems: "center", gap: 2 },
  body: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, alignSelf: "stretch" },
  bodyReversed: { flexDirection: "row-reverse" },
  scoreCol: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  actionsCol: { alignItems: "center", justifyContent: "center", gap: 8 },
});
