import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { usePersistedScore } from "@/hooks/usePersistedScore";
import ResumeModal from "@/components/ResumeModal";
import SettingsModal from "@/components/SettingsModal";

type BaseballSave = { teamA: string; teamB: string; scoresA: number[]; scoresB: number[] };

export default function BaseballScore() {
  const [innings, setInnings] = useState(6);
  const [teamA, setTeamA] = useState("Équipe A");
  const [teamB, setTeamB] = useState("Équipe B");
  const [scoresA, setScoresA] = useState<number[]>(Array(9).fill(0));
  const [scoresB, setScoresB] = useState<number[]>(Array(9).fill(0));
  const [showModal, setShowModal] = useState(false);
  const { width, height } = useWindowDimensions();
  const isPortrait = height > width;
  const persist = usePersistedScore<BaseballSave>("baseball");

  useEffect(() => {
    if (!persist.isLoaded) return;
    persist.save({ teamA, teamB, scoresA, scoresB });
  }, [teamA, teamB, scoresA, scoresB, persist.isLoaded]);

  const handleResume = useCallback(() => {
    const data = persist.resume();
    if (!data) return;
    setTeamA(data.teamA); setTeamB(data.teamB);
    setScoresA(data.scoresA); setScoresB(data.scoresB);
    setInnings(data.scoresA.length);
  }, [persist]);

  useEffect(() => {
    setScoresA(Array(innings).fill(0));
    setScoresB(Array(innings).fill(0));
  }, [innings]);

  const handleScoreChange = (team: "A" | "B", inning: number, delta: number) => {
    const scores = team === "A" ? [...scoresA] : [...scoresB];
    scores[inning] = Math.max(0, scores[inning] + delta);
    team === "A" ? setScoresA(scores) : setScoresB(scores);
  };

  const reset = useCallback(() => {
    setScoresA(Array(innings).fill(0));
    setScoresB(Array(innings).fill(0));
  }, [innings]);

  const total = (scores: number[]) => scores.reduce((a, b) => a + b, 0);

  return (
    <View style={[styles.container, { paddingTop: isPortrait ? 60 : 10 }]}>
      <ResumeModal
        visible={persist.hasSavedScore}
        onResume={handleResume}
        onDiscard={persist.clear}
      />

      {/* MODAL */}
      <SettingsModal visible={showModal} onClose={() => setShowModal(false)} onReset={reset}>
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
      </SettingsModal>

      <TouchableOpacity style={styles.burger} onPress={() => setShowModal(true)}>
        <MaterialCommunityIcons name="baseball-bat" size={44} color="white" />
        <Text style={styles.burgerIcon}>☰</Text>
      </TouchableOpacity>

      <ScrollView horizontal style={{ marginTop: 80 }}>
        <View>
          <View style={styles.row}>
            <Text style={styles.cell}></Text>
            {Array.from({ length: innings }).map((_, i) => (
              <Text key={i} style={styles.cell}>{i + 1}</Text>
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
                  <TouchableOpacity onPress={() => handleScoreChange(id as "A" | "B", i, -1)}>
                    <Text style={styles.control}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.score}>{score}</Text>
                  <TouchableOpacity onPress={() => handleScoreChange(id as "A" | "B", i, 1)}>
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
});
