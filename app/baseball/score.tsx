// app/baseball/score.tsx
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
export default function BaseballScore() {
  const [innings, setInnings] = useState(6);
  const [teamA, setTeamA] = useState("Équipe A");
  const [teamB, setTeamB] = useState("Équipe B");
  const [scoresA, setScoresA] = useState<number[]>(Array(9).fill(0));
  const [scoresB, setScoresB] = useState<number[]>(Array(9).fill(0));
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();
  const isPortrait =
    Dimensions.get("window").height > Dimensions.get("window").width;

  useEffect(() => {
    setScoresA(Array(innings).fill(0));
    setScoresB(Array(innings).fill(0));
  }, [innings]);

  const handleScoreChange = (
    team: "A" | "B",
    inning: number,
    delta: number
  ) => {
    const scores = team === "A" ? [...scoresA] : [...scoresB];
    scores[inning] = Math.max(0, scores[inning] + delta);
    team === "A" ? setScoresA(scores) : setScoresB(scores);
  };

  const reset = () => {
    setScoresA(Array(innings).fill(0));
    setScoresB(Array(innings).fill(0));
  };

  const total = (scores: number[]) => scores.reduce((a, b) => a + b, 0);

  return (
    <View style={styles.container}>
      <Modal visible={showModal} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setShowModal(false)}>
          <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Paramètres</Text>
            <TextInput
              placeholder="Équipe A"
              value={teamA}
              onChangeText={setTeamA}
              style={styles.input}
            />
            <TextInput
              placeholder="Équipe B"
              value={teamB}
              onChangeText={setTeamB}
              style={styles.input}
            />
            <Text style={styles.inputTitle}>Nombre de manches</Text>
            <TextInput
              placeholder="Nombre de manches"
              keyboardType="numeric"
              value={innings.toString()}
              onChangeText={(t) => setInnings(Math.max(1, Number(t)))}
              style={styles.input}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => router.push("/")}>
                <Text style={styles.btn}>🏠</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={reset}>
                <Text style={styles.btn}>🔁</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.btn}>✅</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <TouchableOpacity
        style={styles.burger}
        onPress={() => setShowModal(true)}
      >
        <MaterialCommunityIcons name="baseball-bat" size={44} color="white" />
        <Text style={styles.burgerIcon}>☰</Text>
      </TouchableOpacity>

      <ScrollView horizontal style={{ marginTop: 80 }}>
        <View>
          <View style={styles.row}>
            <Text style={styles.cell}></Text>
            {Array.from({ length: innings }).map((_, i) => (
              <Text key={i} style={styles.cell}>
                {i + 1}
              </Text>
            ))}
            <Text style={styles.cell}>Total</Text>
          </View>

          {[
            { team: teamA, scores: scoresA, id: "A" },
            { team: teamB, scores: scoresB, id: "B" },
          ].map(({ team, scores, id }) => (
            <View key={id} style={styles.row}>
              <Text style={styles.cell}>{team}</Text>
              {scores.map((score, i) => (
                <View key={i} style={styles.scoreCell}>
                  <TouchableOpacity
                    onPress={() => handleScoreChange(id as "A" | "B", i, -1)}
                  >
                    <Text style={styles.control}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.score}>{score}</Text>
                  <TouchableOpacity
                    onPress={() => handleScoreChange(id as "A" | "B", i, 1)}
                  >
                    <Text style={styles.control}>+</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <Text style={styles.cell}>{total(scores)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop:
      Dimensions.get("window").height > Dimensions.get("window").width
        ? 60
        : 10,
  },
  burger: {
    position: "absolute",
    top: 30,
    right: "5%",
    zIndex: 10,
  },
  burgerIcon: {
    fontSize: 40,
    color: "#fff",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  cell: {
    width: 60,
    color: "#fff",
    textAlign: "center",
    padding: 8,
    fontWeight: "bold",
  },
  scoreCell: {
    width: 60,
    alignItems: "center",
  },
  score: {
    fontSize: 28,
    color: "#fff",
  },
  control: {
    color: "#9aad61",
    fontSize: 28,
    fontWeight: "bold",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#222",
    padding: 20,
    borderRadius: 12,
    width: "80%",
  },
  modalTitle: {
    fontSize: 22,
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
  },
  inputTitle: {
    fontSize: 12,
    color: "#fff",
    marginBottom: 2,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#333",
    color: "#fff",
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  btn: {
    fontSize: 20,
    color: "#fff",
    backgroundColor: "#444",
    padding: 10,
    borderRadius: 8,
  },
});
