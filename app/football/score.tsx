import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { Audio } from "expo-av";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Ionicons from "@expo/vector-icons/Ionicons";
import { usePersistedScore } from "@/hooks/usePersistedScore";
import { useGameTimer } from "@/hooks/useGameTimer";
import ResumeModal from "@/components/ResumeModal";
import SettingsModal from "@/components/SettingsModal";

type FootballSave = { scoreA: number; scoreB: number; teamA: string; teamB: string };

export default function FootballScore() {
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [teamA, setTeamA] = useState("Équipe A");
  const [teamB, setTeamB] = useState("Équipe B");
  const [showModal, setShowModal] = useState(false);
  const [halfDuration, setHalfDuration] = useState(45);
  const [isTraining, setIsTraining] = useState(true);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const { width, height } = useWindowDimensions();
  const isPortrait = height > width;
  const persist = usePersistedScore<FootballSave>("football");

  const playBuzz = useCallback(async () => {
    const { sound: s } = await Audio.Sound.createAsync(
      require("../../assets/buzzer.mp3")
    );
    setSound(s);
    await s.playAsync();
  }, []);

  const { timeLeft, isRunning: isHalfRunning, start: startHalfTimer, reset: resetTimer } =
    useGameTimer(playBuzz);

  useEffect(() => {
    if (!persist.isLoaded) return;
    persist.save({ scoreA, scoreB, teamA, teamB });
  }, [scoreA, scoreB, teamA, teamB, persist.isLoaded]);

  const handleResume = useCallback(() => {
    const data = persist.resume();
    if (!data) return;
    setScoreA(data.scoreA); setScoreB(data.scoreB);
    setTeamA(data.teamA); setTeamB(data.teamB);
  }, [persist]);

  useEffect(() => {
    return () => { sound?.unloadAsync(); };
  }, [sound]);

  const resetScores = useCallback(() => {
    setScoreA(0);
    setScoreB(0);
    resetTimer();
  }, [resetTimer]);

  const handleScore = useCallback((team: "A" | "B", delta: number) => {
    if (team === "A") setScoreA((s) => Math.max(0, s + delta));
    else setScoreB((s) => Math.max(0, s + delta));
  }, []);

  return (
    <View style={[styles.container, { paddingTop: isPortrait ? 60 : 10 }]}>
      <ResumeModal
        visible={persist.hasSavedScore}
        onResume={handleResume}
        onDiscard={persist.clear}
      />

      {/* MODAL */}
      <SettingsModal visible={showModal} onClose={() => setShowModal(false)} onReset={resetScores}>
        <TextInput placeholder="Nom équipe A" value={teamA} onChangeText={setTeamA} style={styles.input} />
        <TextInput placeholder="Nom équipe B" value={teamB} onChangeText={setTeamB} style={styles.input} />
        <Text style={styles.inputTitle}>Durée mi-temps (min)</Text>
        <TextInput
          placeholder="Durée d'une mi-temps (min)"
          value={halfDuration.toString()}
          onChangeText={(t) => setHalfDuration(Number(t))}
          style={styles.input}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.switchBtn} onPress={() => setIsTraining((v) => !v)}>
          <Text style={styles.switchText}>Match : {isTraining ? "✅" : "❌"}</Text>
        </TouchableOpacity>
      </SettingsModal>

      {/* BURGER */}
      <TouchableOpacity style={styles.burger} onPress={() => setShowModal(true)}>
        <Ionicons name="football" size={40} color="white" />
        <Text style={{ fontSize: 44, color: "white" }}>☰</Text>
      </TouchableOpacity>

      {/* CHRONO + BOUTON START */}
      <View style={styles.timerBox}>
        {isTraining && !isHalfRunning && (
          <TouchableOpacity onPress={() => startHalfTimer(halfDuration)}>
            <Text style={styles.timerStart}>▶️</Text>
          </TouchableOpacity>
        )}
        {isHalfRunning && (
          <Text style={styles.timerDisplay}>
            ⏱️ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
          </Text>
        )}
      </View>

      {/* SCORES */}
      <View style={styles.teamBox}>
        <Text style={styles.teamName}>{teamA}</Text>
        <TouchableOpacity onPress={() => handleScore("A", -1)}>
          <MaterialCommunityIcons name="eraser" size={32} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleScore("A", 1)}>
          <Text style={styles.score}>{scoreA}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.teamBox}>
        <Text style={styles.teamName}>{teamB}</Text>
        <TouchableOpacity onPress={() => handleScore("B", -1)}>
          <MaterialCommunityIcons name="eraser" size={32} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleScore("B", 1)}>
          <Text style={styles.score}>{scoreB}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    padding: 10,
  },
  teamBox: {
    alignItems: "center",
    justifyContent: "flex-end",
    flex: 1,
    gap: 10,
  },
  teamName: { fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 10 },
  score: { color: "#fff", fontSize: 120, fontWeight: "bold" },
  burger: { position: "absolute", top: 30, left: "48%", zIndex: 10 },
  timerBox: { position: "absolute", top: 30, left: 10, zIndex: 10 },
  timerStart: { color: "#0f0", fontSize: 22, fontWeight: "bold" },
  timerDisplay: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  inputTitle: { fontSize: 12, color: "#fff", marginBottom: 2, textAlign: "center" },
  input: { backgroundColor: "#333", color: "#fff", padding: 10, borderRadius: 6, marginBottom: 10 },
  switchBtn: { padding: 10, backgroundColor: "#555", borderRadius: 6, marginBottom: 10 },
  switchText: { color: "#fff", textAlign: "center" },
});
