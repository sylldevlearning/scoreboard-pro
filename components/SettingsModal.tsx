import { memo } from "react";
import { Modal, Pressable, View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

type Props = {
  visible: boolean;
  onClose: () => void;
  onReset: () => void;
  children?: React.ReactNode;
};

function SettingsModal({ visible, onClose, onReset, children }: Props) {
  const router = useRouter();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.box} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Paramètres</Text>

          {children}

          <View style={styles.buttons}>
            <Pressable style={styles.btn} onPress={() => router.push("/")}>
              <Text style={styles.btnText}>🏠</Text>
            </Pressable>
            <Pressable style={styles.btn} onPress={onReset}>
              <Text style={styles.btnText}>🔁</Text>
            </Pressable>
            <Pressable style={styles.btn} onPress={onClose}>
              <Text style={styles.btnText}>✅</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default memo(SettingsModal);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    backgroundColor: "#222",
    padding: 20,
    borderRadius: 12,
    width: "80%",
  },
  title: {
    fontSize: 22,
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  btn: {
    fontSize: 20,
    backgroundColor: "#444",
    padding: 10,
    borderRadius: 8,
  },
  btnText: {
    fontSize: 20,
    color: "#fff",
  },
});
