import { useState, useEffect, useCallback } from "react";
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
import { useCardManager } from "@/hooks/useCardManager";
import type { CardTypeConfig } from "@/hooks/useCardManager";
import CardTracker from "@/components/CardTracker";
import CardActionButtons from "@/components/CardActionButtons";
import ResumeModal from "@/components/ResumeModal";
import SettingsModal from "@/components/SettingsModal";
import RotateButton from "@/components/RotateButton";
import TeamPanel from "@/components/TeamPanel";
import { applyScoreDelta } from "@/utils/scoring/common";

const RUGBY_CARDS: CardTypeConfig[] = [
  { type: "yellow", label: "Carton jaune (10 min)", emoji: "🟨", color: "#f1c40f", penaltySeconds: 600 },
  { type: "red", label: "Carton rouge (expulsion)", emoji: "🟥", color: "#e74c3c" },
];

type RugbySave = { scoreA: number; scoreB: number; teamA: string; teamB: string };

export default function RugbyScore() {
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [teamA, setTeamA] = useState("Équipe A");
  const [teamB, setTeamB] = useState("Équipe B");
  const [showModal, setShowModal] = useState(false);
  const [halfDuration, setHalfDuration] = useState(40);
  const [isTraining, setIsTraining] = useState(true);
  const [playersPerTeam, setPlayersPerTeam] = useState(15);
  const buzzer = useAudioPlayer(require("../../assets/buzzer.mp3"));

  const { width, isPortrait, isLandscape, scoreFont } = useScoreLayout();
  const { save, resume: resumeSave, clear: clearSave, hasSavedScore, isLoaded } = usePersistedScore<RugbySave>("rugby");

  const playBuzz = useCallback(async () => {
    try {
      await buzzer.seekTo(0);
      buzzer.play();
    } catch (e) {
      if (__DEV__) console.warn("Buzzer error:", e);
    }
  }, [buzzer]);

  const { timeLeft, isRunning: isHalfRunning, start: startHalfTimer, reset: resetTimer } =
    useGameTimer(playBuzz);

  const { cards, addCard, resetCards, getPlayersOnField } = useCardManager(isHalfRunning);

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

  const resetScores = useCallback(() => {
    setScoreA(0);
    setScoreB(0);
    resetTimer();
    resetCards();
  }, [resetTimer, resetCards]);

  const handleAddCard = useCallback((team: "A" | "B", cardType: string) => {
    const cfg = RUGBY_CARDS.find((c) => c.type === cardType);
    addCard(team, cardType, cfg?.penaltySeconds);
  }, [addCard]);

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
        <Text style={styles.inputTitle}>Durée mi-temps (min)</Text>
        <TextInput
          placeholder="Durée d'une mi-temps (min)"
          value={halfDuration.toString()}
          onChangeText={(t) => { const v = parseInt(t, 10); if (!isNaN(v) && v > 0) setHalfDuration(v); }}
          style={styles.input}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.switchBtn} onPress={() => setIsTraining((v) => !v)}>
          <Text style={styles.switchText}>Mode match : {isTraining ? "✅" : "❌"}</Text>
        </TouchableOpacity>
        <Text style={styles.inputTitle}>Joueurs par équipe</Text>
        <TextInput
          value={playersPerTeam.toString()}
          onChangeText={(t) => { const v = parseInt(t, 10); if (!isNaN(v) && v > 0) setPlayersPerTeam(v); }}
          style={styles.input}
          keyboardType="numeric"
        />
      </SettingsModal>

      {/* Header */}
      <View style={[styles.header, { paddingTop: isPortrait ? 30 : 6 }]}>
        <View style={styles.timerArea}>
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
        <View style={{ flex: 1 }} />
        <RotateButton />
        <TouchableOpacity style={styles.burger} onPress={() => setShowModal(true)}>
          <MaterialCommunityIcons name="rugby" size={26} color="white" />
          <Text style={styles.burgerText}>☰</Text>
        </TouchableOpacity>
      </View>

      {/* Teams */}
      <View style={[styles.teamsRow, isLandscape && styles.teamsRowLandscape]}>
        {([["A", teamA, scoreA], ["B", teamB, scoreB]] as const).map(([team, name, score]) => (
          <TeamPanel
            key={team}
            side={team}
            isLandscape={isLandscape}
            title={<Text style={styles.teamName} numberOfLines={1}>{name}</Text>}
            info={
              <>
                <Text style={styles.playerCount}>👤 {getPlayersOnField(team, playersPerTeam)}/{playersPerTeam}</Text>
                <CardTracker team={team} cards={cards} cardTypes={RUGBY_CARDS} />
              </>
            }
            scoreAside={
              <TouchableOpacity onPress={() => handleScore(team, -1)}>
                <MaterialCommunityIcons name="eraser" size={28} color="white" />
              </TouchableOpacity>
            }
            score={<Text style={[styles.score, { fontSize: scoreFont }]}>{score}</Text>}
            actions={
              <>
                {/* buttons in a row in portrait, a 2-column grid in landscape */}
                <View style={[styles.row, isLandscape && styles.grid]}>
                  <TouchableOpacity onPress={() => handleScore(team, 2)}><Text style={styles.btn}>+2</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => handleScore(team, 3)}><Text style={styles.btn}>+3</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => handleScore(team, 5)}><Text style={styles.btn}>+5</Text></TouchableOpacity>
                </View>
                <CardActionButtons team={team} teamName={name} cardTypes={RUGBY_CARDS} onAddCard={handleAddCard} />
              </>
            }
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    flexDirection: "column",
  },
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
  teamsRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  teamsRowLandscape: { alignItems: "stretch", gap: 24, paddingHorizontal: 16, paddingBottom: 8 },
  teamName: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  score: { color: "#fff", fontWeight: "bold" },
  row: { flexDirection: "row", gap: 20 },
  grid: { flexWrap: "wrap", justifyContent: "center", gap: 10, width: 130 },
  btn: { fontSize: 20, color: "#fff", backgroundColor: "#444", paddingVertical: 12, paddingHorizontal: 10, borderRadius: 8 },
  playerCount: { fontSize: 13, color: "#aaa", fontWeight: "600" },
  inputTitle: { fontSize: 12, color: "#fff", marginBottom: 2, textAlign: "center" },
  input: { backgroundColor: "#333", color: "#fff", padding: 10, borderRadius: 6, marginBottom: 10 },
  switchBtn: { padding: 10, backgroundColor: "#555", borderRadius: 6, marginBottom: 10 },
  switchText: { color: "#fff", textAlign: "center" },
});
