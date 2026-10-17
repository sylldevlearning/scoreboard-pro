import { useState, memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
} from "react-native";

export type HockeyPenaltyType = {
  type: string;
  label: string;
  duration: string;
  seconds: number | undefined;
  color: string;
};

export const HOCKEY_PENALTY_TYPES: HockeyPenaltyType[] = [
  { type: "minor", label: "Faute mineure", duration: "2 min", seconds: 120, color: "#f39c12" },
  { type: "major", label: "Faute majeure", duration: "5 min", seconds: 300, color: "#e74c3c" },
  { type: "misconduct", label: "Mauvaise conduite", duration: "10 min", seconds: 600, color: "#8e44ad" },
  { type: "match", label: "Expulsion définitive", duration: "Match", seconds: undefined, color: "#c0392b" },
];

type Props = {
  team: "A" | "B";
  teamName: string;
  onAddPenalty: (team: "A" | "B", type: string, seconds: number | undefined) => void;
};

function HockeyPenaltyButtons({ team, teamName, onAddPenalty }: Props) {
  const [visible, setVisible] = useState(false);
  const [pendingMatch, setPendingMatch] = useState(false);

  const handlePress = (type: string, seconds: number | undefined) => {
    if (type === "match" && !pendingMatch) {
      setPendingMatch(true);
      return;
    }
    onAddPenalty(team, type, seconds);
    setVisible(false);
    setPendingMatch(false);
  };

  const handleClose = () => {
    setVisible(false);
    setPendingMatch(false);
  };

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setVisible(true)}>
        <Text style={styles.triggerText}>🚨 Pénalité</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={handleClose}>
          <Pressable style={styles.box} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.title}>Pénalité — {teamName}</Text>

            {pendingMatch ? (
              <>
                <Text style={styles.confirmMsg}>
                  ⛔ Confirmer l'expulsion définitive ?
                </Text>
                <View style={styles.confirmRow}>
                  <TouchableOpacity
                    style={styles.btnConfirm}
                    onPress={() => handlePress("match", undefined)}
                  >
                    <Text style={styles.btnConfirmText}>Confirmer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.btnCancel}
                    onPress={() => setPendingMatch(false)}
                  >
                    <Text style={styles.btnCancelText}>Annuler</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.penaltyList}>
                {HOCKEY_PENALTY_TYPES.map((p) => (
                  <TouchableOpacity
                    key={p.type}
                    style={[styles.penaltyBtn, { borderColor: p.color }]}
                    onPress={() => handlePress(p.type, p.seconds)}
                  >
                    <Text style={[styles.penaltyDuration, { color: p.color }]}>
                      {p.duration}
                    </Text>
                    <Text style={styles.penaltyLabel}>{p.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity onPress={handleClose} style={styles.closeTouchable}>
              <Text style={styles.closeText}>Fermer</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export default memo(HockeyPenaltyButtons);

const styles = StyleSheet.create({
  trigger: {
    backgroundColor: "#1a3a7a",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
    minWidth: 44,
    alignItems: "center",
  },
  triggerText: { color: "#fff", fontSize: 13, fontWeight: "bold" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    backgroundColor: "#222",
    padding: 20,
    borderRadius: 14,
    width: "80%",
    maxWidth: 320,
  },
  title: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  penaltyList: { gap: 10, marginBottom: 14 },
  penaltyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 44,
  },
  penaltyDuration: { fontSize: 16, fontWeight: "bold", minWidth: 48 },
  penaltyLabel: { color: "#fff", fontSize: 14, flex: 1 },
  confirmMsg: {
    color: "#fff",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 16,
  },
  confirmRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  btnConfirm: {
    flex: 1,
    backgroundColor: "#c0392b",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  btnConfirmText: { color: "#fff", fontWeight: "bold" },
  btnCancel: {
    flex: 1,
    backgroundColor: "#555",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  btnCancelText: { color: "#fff" },
  closeTouchable: { alignItems: "center", paddingVertical: 6 },
  closeText: { color: "#aaa", fontSize: 13, textDecorationLine: "underline" },
});
