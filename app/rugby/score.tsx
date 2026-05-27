import { useState, useEffect, useRef, useCallback } from "react";
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
import { usePersistedScore } from "@/hooks/usePersistedScore";
import { useGameTimer } from "@/hooks/useGameTimer";
import { useCardManager } from "@/hooks/useCardManager";
import type { CardTypeConfig } from "@/hooks/useCardManager";
import CardTracker from "@/components/CardTracker";
import CardActionButtons from "@/components/CardActionButtons";
import ResumeModal from "@/components/ResumeModal";
import SettingsModal from "@/components/SettingsModal";

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
  const soundRef = useRef<Audio.Sound | null>(null);

  // Undo: last scored action per team
  const lastActionA = useRef<number | null>(null);
  const lastActionB = useRef<number | null>(null);
  const [undoToast, setUndoToast] = useState<string | null>(null);
  const undoToastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { width, height } = useWindowDimensions();
  const isPortrait = height > width;
  const { save, resume: resumeSave, clear: clearSave, hasSavedScore, isLoaded } = usePersistedScore<RugbySave>("rugby");

  useEffect(() => {
    return () => {
      if (undoToastRef.current) clearTimeout(undoToastRef.current);
      soundRef.current?.unloadAsync();
    };
  }, []);

  const showUndoToast = useCallback((msg: string) => {
    if (undoToastRef.current) clearTimeout(undoToastRef.current);
    setUndoToast(msg);
    undoToastRef.current = setTimeout(() => {
      setUndoToast(null);
      undoToastRef.current = null;
    }, 1500);
  }, []);

  const playBuzz = useCallback(async () => {
    try {
      await soundRef.current?.unloadAsync();
      const { sound } = await Audio.Sound.createAsync(require("../../assets/buzzer.mp3"));
      soundRef.current = sound;
      await sound.playAsync();
    } catch (e) {
      if (__DEV__) console.warn("Buzzer error:", e);
    }
  }, []);

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
    lastActionA.current = null;
    lastActionB.current = null;
    setUndoToast(null);
    resetTimer();
    resetCards();
  }, [resetTimer, resetCards]);

  const handleAddCard = useCallback((team: "A" | "B", cardType: string) => {
    const cfg = RUGBY_CARDS.find((c) => c.type === cardType);
    addCard(team, cardType, cfg?.penaltySeconds);
  }, [addCard]);

  const handleScore = useCallback((team: "A" | "B", delta: number) => {
    if (team === "A") {
      setScoreA((s) => Math.max(0, s + delta));
      lastActionA.current = delta;
    } else {
      setScoreB((s) => Math.max(0, s + delta));
      lastActionB.current = delta;
    }
  }, []);

  const handleUndo = useCallback((team: "A" | "B") => {
    const last = team === "A" ? lastActionA.current : lastActionB.current;
    if (last === null) return;
    if (team === "A") {
      setScoreA((s) => Math.max(0, s - last));
      lastActionA.current = null;
    } else {
      setScoreB((s) => Math.max(0, s - last));
      lastActionB.current = null;
    }
    showUndoToast(`+${last} annulé`);
  }, [showUndoToast]);

  return (
    <View style={[styles.container, { paddingTop: isPortrait ? 60 : 10 }]}>
      <ResumeModal
        visible={hasSavedScore}
        onResume={handleResume}
        onDiscard={clearSave}
      />

      {/* MODAL */}
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

      {/* Burger */}
      <TouchableOpacity style={styles.burger} onPress={() => setShowModal(true)}>
        <MaterialCommunityIcons name="rugby" size={40} color="white" />
        <Text style={{ fontSize: 40, color: "white" }}>☰</Text>
      </TouchableOpacity>

      {/* Chrono */}
      {isHalfRunning && (
        <Text style={styles.timerTopLeft}>
          ⏱️ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
        </Text>
      )}
      {isTraining && !isHalfRunning && (
        <TouchableOpacity onPress={() => startHalfTimer(halfDuration)} style={styles.timerTopLeft}>
          <Text style={styles.timerStart}>▶️</Text>
        </TouchableOpacity>
      )}

      {/* Équipe A */}
      <View style={styles.teamBox}>
        <Text style={styles.teamName}>{teamA}</Text>
        <Text style={styles.playerCount}>
          👤 {getPlayersOnField("A", playersPerTeam)}/{playersPerTeam}
        </Text>
        <CardTracker team="A" cards={cards} cardTypes={RUGBY_CARDS} />
        <TouchableOpacity onPress={() => handleUndo("A")} style={styles.undoBtn}>
          <MaterialCommunityIcons name="eraser" size={28} color="#aaa" />
        </TouchableOpacity>
        <Text style={styles.score}>{scoreA}</Text>
        <View style={styles.row}>
          <TouchableOpacity onPress={() => handleScore("A", 2)}>
            <Text style={styles.btn}>+2</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleScore("A", 3)}>
            <Text style={styles.btn}>+3</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleScore("A", 5)}>
            <Text style={styles.btn}>+5</Text>
          </TouchableOpacity>
        </View>
        <CardActionButtons
          team="A"
          teamName={teamA}
          cardTypes={RUGBY_CARDS}
          onAddCard={handleAddCard}
        />
      </View>

      {/* Équipe B */}
      <View style={styles.teamBox}>
        <Text style={styles.teamName}>{teamB}</Text>
        <Text style={styles.playerCount}>
          👤 {getPlayersOnField("B", playersPerTeam)}/{playersPerTeam}
        </Text>
        <CardTracker team="B" cards={cards} cardTypes={RUGBY_CARDS} />
        <TouchableOpacity onPress={() => handleUndo("B")} style={styles.undoBtn}>
          <MaterialCommunityIcons name="eraser" size={28} color="#aaa" />
        </TouchableOpacity>
        <Text style={styles.score}>{scoreB}</Text>
        <View style={styles.row}>
          <TouchableOpacity onPress={() => handleScore("B", 2)}>
            <Text style={styles.btn}>+2</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleScore("B", 3)}>
            <Text style={styles.btn}>+3</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleScore("B", 5)}>
            <Text style={styles.btn}>+5</Text>
          </TouchableOpacity>
        </View>
        <CardActionButtons
          team="B"
          teamName={teamB}
          cardTypes={RUGBY_CARDS}
          onAddCard={handleAddCard}
        />
      </View>

      {/* Toast undo */}
      {undoToast && (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>{undoToast}</Text>
        </View>
      )}
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
  teamBox: { alignItems: "center", justifyContent: "flex-end", flex: 1, gap: 10 },
  teamName: { fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 10 },
  score: { color: "#fff", fontSize: 120, fontWeight: "bold" },
  row: { flexDirection: "row", gap: 20, marginTop: 10 },
  burger: { position: "absolute", top: 30, left: "48%", zIndex: 10 },
  timerTopLeft: { position: "absolute", top: 30, left: 20, color: "#fff", fontSize: 20, fontWeight: "bold" },
  timerStart: { color: "#0f0", fontSize: 20, fontWeight: "bold" },
  inputTitle: { fontSize: 12, color: "#fff", marginBottom: 2, textAlign: "center" },
  input: { backgroundColor: "#333", color: "#fff", padding: 10, borderRadius: 6, marginBottom: 10 },
  btn: { fontSize: 20, color: "#fff", backgroundColor: "#444", padding: 10, borderRadius: 8 },
  playerCount: { fontSize: 13, color: "#aaa", fontWeight: "600" },
  switchBtn: { padding: 10, backgroundColor: "#555", borderRadius: 6, marginBottom: 10 },
  switchText: { color: "#fff", textAlign: "center" },
  undoBtn: { padding: 4, opacity: 0.7 },
  toast: {
    position: "absolute",
    bottom: 60,
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  toastText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
