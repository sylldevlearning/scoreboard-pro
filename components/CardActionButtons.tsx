import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
} from "react-native";
import type { CardTypeConfig } from "@/hooks/useCardManager";

type Props = {
  team: "A" | "B";
  teamName: string;
  cardTypes: CardTypeConfig[];
  onAddCard: (team: "A" | "B", cardType: string) => void;
};

export default function CardActionButtons({
  team,
  teamName,
  cardTypes,
  onAddCard,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [pendingRed, setPendingRed] = useState(false);

  const handleCardPress = (cardType: string) => {
    if (cardType === "red" && !pendingRed) {
      setPendingRed(true);
      return;
    }
    onAddCard(team, cardType);
    setVisible(false);
    setPendingRed(false);
  };

  const handleClose = () => {
    setVisible(false);
    setPendingRed(false);
  };

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setVisible(true)}>
        <Text style={styles.triggerText}>🟨+</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={handleClose}>
          <Pressable style={styles.box} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.title}>Carton — {teamName}</Text>

            {pendingRed ? (
              <>
                <Text style={styles.confirmMsg}>
                  🟥 Confirmer l'expulsion définitive ?
                </Text>
                <View style={styles.confirmRow}>
                  <TouchableOpacity
                    style={styles.btnConfirm}
                    onPress={() => handleCardPress("red")}
                  >
                    <Text style={styles.btnConfirmText}>Confirmer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.btnCancel}
                    onPress={() => setPendingRed(false)}
                  >
                    <Text style={styles.btnCancelText}>Annuler</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.cardList}>
                {cardTypes.map((ct) => (
                  <TouchableOpacity
                    key={ct.type}
                    style={[styles.cardBtn, { borderColor: ct.color }]}
                    onPress={() => handleCardPress(ct.type)}
                  >
                    <Text style={styles.cardEmoji}>{ct.emoji}</Text>
                    <Text style={styles.cardLabel}>{ct.label}</Text>
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

const styles = StyleSheet.create({
  trigger: {
    backgroundColor: "#333",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  triggerText: { fontSize: 13 },
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
  cardList: { gap: 10, marginBottom: 14 },
  cardBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  cardEmoji: { fontSize: 22 },
  cardLabel: { color: "#fff", fontSize: 14 },
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
  },
  btnConfirmText: { color: "#fff", fontWeight: "bold" },
  btnCancel: {
    flex: 1,
    backgroundColor: "#555",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  btnCancelText: { color: "#fff" },
  closeTouchable: { alignItems: "center" },
  closeText: { color: "#aaa", fontSize: 13, textDecorationLine: "underline" },
});
