import { useRouter } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function ErrorBoundary({ error }: { error: Error }) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Une erreur est survenue</Text>
      <Text style={styles.message}>{error.message}</Text>
      <TouchableOpacity style={styles.btn} onPress={() => router.replace("/" as any)}>
        <Text style={styles.btnText}>Retour à l'accueil</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  message: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 32,
    textAlign: "center",
  },
  btn: {
    backgroundColor: "#333",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
  },
});
