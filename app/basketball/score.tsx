import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useAudioPlayer } from "expo-audio";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { usePersistedScore } from "@/hooks/usePersistedScore";
import { HEADER_H, useScoreLayout } from "@/hooks/useScoreLayout";
import { useGameTimer } from "@/hooks/useGameTimer";
import ResumeModal from "@/components/ResumeModal";
import SettingsModal from "@/components/SettingsModal";
import TeamPanel from "@/components/TeamPanel";
import { applyScoreDelta } from "@/utils/scoring/common";

type BasketballSave = { scoreA: number; scoreB: number; teamA: string; teamB: string };

export default function BasketScore() {
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [teamA, setTeamA] = useState("Équipe A");
  const [teamB, setTeamB] = useState("Équipe B");
  const [showModal, setShowModal] = useState(false);
  const [quarterDuration, setQuarterDuration] = useState(10);
  const [timeoutsPerTeam, setTimeoutsPerTeam] = useState(2);
  const [timeoutsA, setTimeoutsA] = useState(2);
  const [timeoutsB, setTimeoutsB] = useState(2);
  const [isTraining, setIsTraining] = useState(true);
  const [isTimeout, setIsTimeout] = useState(false);
  const [timeoutTimer, setTimeoutTimer] = useState(30);
  const timeoutIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const buzzer = useAudioPlayer(require("../../assets/buzzer.mp3"));

  useEffect(() => {
    return () => {
      if (timeoutIntervalRef.current) clearInterval(timeoutIntervalRef.current);
    };
  }, []);

  const { width, isPortrait, isLandscape, scoreFont } = useScoreLayout();
  const { save, resume: resumeSave, clear: clearSave, hasSavedScore, isLoaded } = usePersistedScore<BasketballSave>("basketball");

  const playBuzz = useCallback(async () => {
    try {
      await buzzer.seekTo(0);
      buzzer.play();
    } catch (e) {
      if (__DEV__) console.warn("Buzzer error:", e);
    }
  }, [buzzer]);

  const { timeLeft, isRunning: isQuarterRunning, start: startQuarterTimer, reset: resetTimer } =
    useGameTimer(playBuzz);

  useEffect(() => {
    if (!isLoaded) return;
    save({ scoreA, scoreB, teamA, teamB });
  }, [scoreA, scoreB, teamA, teamB, isLoaded, save]);

  const handleResume = useCallback(() => {
    const data = resumeSave();
    if (!data) return;
    setScoreA(data.scoreA); setScoreB(data.scoreB);
    setTeamA(data.teamA); setTeamB(data.teamB);
  }, [resumeSave]);

  const startTimeout = useCallback((team: "A" | "B") => {
    // The ref check also catches a double tap faster than the re-render.
    if (isTimeout || timeoutIntervalRef.current) return;
    if ((team === "A" && timeoutsA === 0) || (team === "B" && timeoutsB === 0)) return;

    playBuzz();
    setIsTimeout(true);
    setTimeoutTimer(30);

    timeoutIntervalRef.current = setInterval(() => {
      setTimeoutTimer((prev) => {
        if (prev <= 0) return 0;
        if (prev === 1) {
          clearInterval(timeoutIntervalRef.current!);
          timeoutIntervalRef.current = null;
          setIsTimeout(false);
          playBuzz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    if (team === "A") setTimeoutsA((t) => t - 1);
    else setTimeoutsB((t) => t - 1);
  }, [playBuzz, isTimeout, timeoutsA, timeoutsB]);

  const resetScores = useCallback(() => {
    if (timeoutIntervalRef.current) clearInterval(timeoutIntervalRef.current);
    timeoutIntervalRef.current = null;
    setIsTimeout(false);
    setScoreA(0);
    setScoreB(0);
    setTimeoutsA(timeoutsPerTeam);
    setTimeoutsB(timeoutsPerTeam);
    resetTimer();
  }, [timeoutsPerTeam, resetTimer]);

  const handleScore = useCallback((team: "A" | "B", delta: number) => {
    if (team === "A") setScoreA((s) => applyScoreDelta(s, delta));
    else setScoreB((s) => applyScoreDelta(s, delta));
  }, []);

  return (
    <View style={styles.container}>
      <ResumeModal visible={hasSavedScore} onResume={handleResume} onDiscard={clearSave} />

      <SettingsModal visible={showModal} onClose={() => setShowModal(false)} onReset={resetScores}>
        <TextInput placeholder="Nom équipe A" value={teamA} onChangeText={setTeamA} style={styles.input} />
        <TextInput placeholder="Nom équipe B" value={teamB} onChangeText={setTeamB} style={styles.input} />
        <Text style={styles.inputTitle}>Durée quart-temps (min)</Text>
        <TextInput
          placeholder="Durée quart-temps (min)"
          value={quarterDuration.toString()}
          onChangeText={(t) => { const v = parseInt(t, 10); if (!isNaN(v) && v > 0) setQuarterDuration(v); }}
          style={styles.input}
          keyboardType="numeric"
        />
        <Text style={styles.inputTitle}>Nb temps morts / équipe</Text>
        <TextInput
          placeholder="Nb temps morts / équipe"
          value={timeoutsPerTeam.toString()}
          onChangeText={(t) => {
            const val = parseInt(t, 10);
            if (!isNaN(val) && val >= 0) {
              setTimeoutsPerTeam(val);
              setTimeoutsA(val);
              setTimeoutsB(val);
            }
          }}
          style={styles.input}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.switchBtn} onPress={() => setIsTraining((v) => !v)}>
          <Text style={styles.switchText}>Mode match : {isTraining ? "✅" : "❌"}</Text>
        </TouchableOpacity>
      </SettingsModal>

      {/* Header */}
      <View style={[styles.header, { paddingTop: isPortrait ? 30 : 6 }]}>
        <View style={styles.timerArea}>
          {isQuarterRunning && (
            <Text style={styles.timerDisplay}>
              ⏱️ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
            </Text>
          )}
          {isTraining && !isQuarterRunning && (
            <TouchableOpacity onPress={() => startQuarterTimer(quarterDuration)}>
              <Text style={styles.timerStart}>▶️</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.burger} onPress={() => setShowModal(true)}>
          <MaterialCommunityIcons name="basketball-hoop-outline" size={26} color="white" />
          <Text style={styles.burgerText}>☰</Text>
        </TouchableOpacity>
      </View>

      {/* Timeout banner */}
      {isTimeout && (
        <View style={styles.timeoutBanner}>
          <Text style={styles.timeoutText}>⏳ Temps mort : {timeoutTimer}s</Text>
        </View>
      )}

      {/* Teams */}
      <View style={[styles.teamsRow, isLandscape && styles.teamsRowLandscape]}>
        {([["A", teamA, scoreA, timeoutsA], ["B", teamB, scoreB, timeoutsB]] as const).map(([team, name, score, timeouts]) => (
          <TeamPanel
            key={team}
            side={team}
            isLandscape={isLandscape}
            title={<Text style={styles.teamName} numberOfLines={1}>{name}</Text>}
            scoreAside={
              <TouchableOpacity onPress={() => handleScore(team, -1)}>
                <MaterialCommunityIcons name="eraser" size={28} color="white" />
              </TouchableOpacity>
            }
            score={
              <TouchableOpacity onPress={() => handleScore(team, 2)}>
                <Text style={[styles.score, { fontSize: scoreFont }]}>{score}</Text>
              </TouchableOpacity>
            }
            actions={
              // 4 buttons in a row in portrait, a 2×2 grid in landscape
              <View style={[styles.row, isLandscape && styles.grid]}>
                <TouchableOpacity onPress={() => handleScore(team, 1)}><Text style={styles.btn}>+1</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => handleScore(team, 2)}><Text style={styles.btn}>+2</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => handleScore(team, 3)}><Text style={styles.btn}>+3</Text></TouchableOpacity>
                <TouchableOpacity disabled={isTimeout} style={isTimeout && styles.disabled} onPress={() => startTimeout(team)}><Text style={styles.btn}>T ({timeouts})</Text></TouchableOpacity>
              </View>
            }
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", flexDirection: "column" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingBottom: 4,
    minHeight: HEADER_H,
  },
  timerArea: { flexDirection: "row", alignItems: "center" },
  timerStart: { color: "#0f0", fontSize: 20, fontWeight: "bold" },
  timerDisplay: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  burger: { flexDirection: "row", alignItems: "center", gap: 6, padding: 8, minWidth: 44, minHeight: 44, justifyContent: "center" },
  burgerText: { fontSize: 26, color: "white" },
  timeoutBanner: {
    backgroundColor: "rgba(255,200,0,0.15)",
    paddingVertical: 4,
    alignItems: "center",
  },
  timeoutText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  teamsRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  // Leaves room at the bottom for the rotation button of the root layout.
  teamsRowLandscape: { alignItems: "stretch", gap: 24, paddingHorizontal: 16, paddingBottom: 44 },
  teamName: { fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 10 },
  score: { color: "#fff", fontWeight: "bold" },
  row: { flexDirection: "row", gap: 10 },
  grid: { flexWrap: "wrap", justifyContent: "center", width: 150 },
  btn: { fontSize: 18, color: "#fff", backgroundColor: "#444", paddingVertical: 13, paddingHorizontal: 10, borderRadius: 8 },
  disabled: { opacity: 0.4 },
  inputTitle: { fontSize: 12, color: "#fff", marginBottom: 2, textAlign: "center" },
  input: { backgroundColor: "#333", color: "#fff", padding: 10, borderRadius: 6, marginBottom: 10 },
  switchBtn: { padding: 10, backgroundColor: "#555", borderRadius: 6, marginBottom: 10 },
  switchText: { color: "#fff", textAlign: "center" },
});
