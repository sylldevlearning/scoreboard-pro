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
import Ionicons from "@expo/vector-icons/Ionicons";
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
import { shouldAddAutoRed } from "@/utils/scoring/football";

const FOOTBALL_CARDS: CardTypeConfig[] = [
  { type: "yellow", label: "Carton jaune", emoji: "🟨", color: "#f1c40f" },
  { type: "red", label: "Carton rouge (expulsion)", emoji: "🟥", color: "#e74c3c" },
];

type FootballSave = { scoreA: number; scoreB: number; teamA: string; teamB: string };

export default function FootballScore() {
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [teamA, setTeamA] = useState("Équipe A");
  const [teamB, setTeamB] = useState("Équipe B");
  const [showModal, setShowModal] = useState(false);
  const [halfDuration, setHalfDuration] = useState(45);
  const [isTraining, setIsTraining] = useState(true);
  const buzzer = useAudioPlayer(require("../../assets/buzzer.mp3"));

  const { width, isPortrait, isLandscape, scoreFont } = useScoreLayout();
  const { save, resume: resumeSave, clear: clearSave, hasSavedScore, isLoaded } = usePersistedScore<FootballSave>("football");

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

  const { cards, addCard, getCardCount, resetCards } = useCardManager();

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
    const yellowsBefore = getCardCount(team, "yellow");
    addCard(team, cardType);
    if (shouldAddAutoRed(cardType, yellowsBefore)) {
      addCard(team, "red");
    }
  }, [addCard, getCardCount]);

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
          onChangeText={(t) => setHalfDuration(Number(t))}
          style={styles.input}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.switchBtn} onPress={() => setIsTraining((v) => !v)}>
          <Text style={styles.switchText}>Match : {isTraining ? "✅" : "❌"}</Text>
        </TouchableOpacity>
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
          <Ionicons name="football" size={26} color="white" />
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
            info={<CardTracker team={team} cards={cards} cardTypes={FOOTBALL_CARDS} />}
            scoreAside={
              <TouchableOpacity onPress={() => handleScore(team, -1)}>
                <MaterialCommunityIcons name="eraser" size={32} color="white" />
              </TouchableOpacity>
            }
            score={
              <TouchableOpacity onPress={() => handleScore(team, 1)}>
                <Text style={[styles.score, { fontSize: scoreFont }]}>{score}</Text>
              </TouchableOpacity>
            }
            actions={<CardActionButtons team={team} teamName={name} cardTypes={FOOTBALL_CARDS} onAddCard={handleAddCard} />}
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
  timerStart: { color: "#0f0", fontSize: 22, fontWeight: "bold" },
  timerDisplay: { color: "#fff", fontSize: 22, fontWeight: "bold" },
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
  inputTitle: { fontSize: 12, color: "#fff", marginBottom: 2, textAlign: "center" },
  input: { backgroundColor: "#333", color: "#fff", padding: 10, borderRadius: 6, marginBottom: 10 },
  switchBtn: { padding: 10, backgroundColor: "#555", borderRadius: 6, marginBottom: 10 },
  switchText: { color: "#fff", textAlign: "center" },
});
