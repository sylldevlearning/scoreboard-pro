import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { usePersistedScore } from "@/hooks/usePersistedScore";
import { useScoreLayout } from "@/hooks/useScoreLayout";
import ResumeModal from "@/components/ResumeModal";
import SettingsModal from "@/components/SettingsModal";
import TeamPanel from "@/components/TeamPanel";
import { applyInningScore, emptyInnings, parseInningsInput, totalRuns } from "@/utils/scoring/baseball";

type BaseballSave = { teamA: string; teamB: string; scoresA: number[]; scoresB: number[] };

export default function BaseballScore() {
  const [innings, setInnings] = useState(6);
  const [inningsInput, setInningsInput] = useState("6");
  const [teamA, setTeamA] = useState("Équipe A");
  const [teamB, setTeamB] = useState("Équipe B");
  const [scoresA, setScoresA] = useState<number[]>(emptyInnings(6));
  const [scoresB, setScoresB] = useState<number[]>(emptyInnings(6));
  const [showModal, setShowModal] = useState(false);
  const { width, isPortrait, isLandscape, scoreFont } = useScoreLayout();
  const { save, resume: resumeSave, clear: clearSave, hasSavedScore, isLoaded } = usePersistedScore<BaseballSave>("baseball");

  useEffect(() => {
    if (!isLoaded) return;
    save({ teamA, teamB, scoresA, scoresB });
  }, [teamA, teamB, scoresA, scoresB, isLoaded, save]);

  const handleResume = useCallback(() => {
    const data = resumeSave();
    if (!data) return;
    setTeamA(data.teamA); setTeamB(data.teamB);
    setScoresA(data.scoresA); setScoresB(data.scoresB);
    setInnings(data.scoresA.length);
    setInningsInput(String(data.scoresA.length));
  }, [resumeSave]);

  // Only a change made from the settings resets the board; restoring a game
  // sets innings directly and keeps its scores.
  const handleInningsChange = (text: string) => {
    setInningsInput(text);
    const n = parseInningsInput(text);
    if (n === null || n === innings) return;
    setInnings(n);
    setScoresA(emptyInnings(n));
    setScoresB(emptyInnings(n));
  };

  const handleScoreChange = (team: "A" | "B", inning: number, delta: number) => {
    if (team === "A") setScoresA((s) => applyInningScore(s, inning, delta));
    else setScoresB((s) => applyInningScore(s, inning, delta));
  };

  const reset = useCallback(() => {
    setScoresA(emptyInnings(innings));
    setScoresB(emptyInnings(innings));
  }, [innings]);

  const total = totalRuns;

  // Landscape: the table stretches to the screen width (it still scrolls when
  // there are too many innings to fit).
  const nameW = isLandscape ? 120 : 60;
  const cellW = isLandscape
    ? Math.max(48, Math.min(96, (width - 40 - nameW) / (innings + 1)))
    : 60;
  const nameCell = [styles.cell, { width: nameW }];
  const cell = [styles.cell, { width: cellW }];

  return (
    <View style={[styles.container, { paddingTop: isPortrait ? 60 : 10 }]}>
      <ResumeModal
        visible={hasSavedScore}
        onResume={handleResume}
        onDiscard={clearSave}
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
          value={inningsInput}
          onChangeText={handleInningsChange}
          style={styles.input}
        />
      </SettingsModal>

      <TouchableOpacity style={styles.burger} onPress={() => setShowModal(true)}>
        <MaterialCommunityIcons name="baseball-bat" size={44} color="white" />
        <Text style={styles.burgerIcon}>☰</Text>
      </TouchableOpacity>

      <ScrollView horizontal style={{ marginTop: isPortrait ? 70 : 50 }} contentContainerStyle={isLandscape && styles.tableLandscape}>
        <View>
          <View style={styles.row}>
            <Text style={nameCell}></Text>
            {Array.from({ length: innings }).map((_, i) => (
              <Text key={i} style={cell}>{i + 1}</Text>
            ))}
            <Text style={cell}>Total</Text>
          </View>

          {[
            { team: teamA, scores: scoresA, id: "A" },
            { team: teamB, scores: scoresB, id: "B" },
          ].map(({ team, scores, id }) => (
            <View key={id} style={styles.row}>
              <Text style={nameCell} numberOfLines={1}>{team}</Text>
              {scores.map((score, i) => (
                <View key={i} style={[styles.scoreCell, { width: cellW }]}>
                  <TouchableOpacity onPress={() => handleScoreChange(id as "A" | "B", i, -1)}>
                    <Text style={styles.control}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.score}>{score}</Text>
                  <TouchableOpacity onPress={() => handleScoreChange(id as "A" | "B", i, 1)}>
                    <Text style={styles.control}>+</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <Text style={[cell, styles.total]}>{total(scores)}</Text>
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
  total: { fontSize: 22 },
  tableLandscape: { flexGrow: 1, justifyContent: "center" },
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
