import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";

type Props = {
  visible: boolean;
  onResume: () => void;
  onDiscard: () => void;
};

export default function ResumeModal({ visible, onResume, onDiscard }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>Partie sauvegardée</Text>
          <Text style={styles.subtitle}>Reprendre la partie précédente ?</Text>
          <View style={styles.row}>
            <TouchableOpacity style={styles.btnYes} onPress={onResume}>
              <Text style={styles.btnText}>Oui</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnNo} onPress={onDiscard}>
              <Text style={styles.btnText}>Non</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    backgroundColor: "#222",
    borderRadius: 14,
    padding: 24,
    width: "75%",
    alignItems: "center",
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    color: "#ccc",
    fontSize: 15,
    marginBottom: 20,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    gap: 16,
  },
  btnYes: {
    backgroundColor: "#4caf50",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 8,
  },
  btnNo: {
    backgroundColor: "#555",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 8,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
