import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Button } from "react-native";
import { useRouter, Stack } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";

export default function VolleyballScore() {
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const router = useRouter();

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    return () => {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      );
    };
  }, []);

  const resetScores = () => {
    setScoreA(0);
    setScoreB(0);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.scoreBox}
          onPress={() => setScoreA(scoreA + 1)}
        >
          <Text style={styles.label}>Équipe A</Text>
          <Text style={styles.score}>{scoreA}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.scoreBox}
          onPress={() => setScoreB(scoreB + 1)}
        >
          <Text style={styles.label}>Équipe B</Text>
          <Text style={styles.score}>{scoreB}</Text>
        </TouchableOpacity>

        <View style={styles.bottom}>
          <Button title="🔁 Reset" onPress={resetScores} />
          <Button title="⬅️ Retour" onPress={() => router.back()} />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    padding: 20,
  },
  scoreBox: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111",
    borderRadius: 16,
    padding: 20,
    width: 180,
    height: 180,
  },
  label: {
    color: "#aaa",
    fontSize: 20,
    marginBottom: 10,
  },
  score: {
    color: "#fff",
    fontSize: 80,
    fontWeight: "bold",
  },
  bottom: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
