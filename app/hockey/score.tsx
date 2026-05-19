import { useState, useEffect, useCallback, useMemo } from "react";
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
import CardTracker from "@/components/CardTracker";
import CardActionButtons from "@/components/CardActionButtons";
import ResumeModal from "@/components/ResumeModal";
import SettingsModal from "@/components/SettingsModal";

type HockeySave = { scoreA: number; scoreB: number; teamA: string; teamB: string };

type Period = 1 | 2 | 3 | "OT";

export default function HockeyScore() {
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [teamA, setTeamA] = useState("Équipe A");
  const [teamB, setTeamB] = useState("Équipe B");
  const [showModal, setShowModal] = useState(false);
  const [periodDuration, setPeriodDuration] = useState(20);
  const [currentPeriod, setCurrentPeriod] = useState<Period>(1);
  const [yellowPenaltyMinutes, setYellowPenaltyMinutes] = useState(5);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const { width, height } = useWindowDimensions();
  const isPortrait = height > width;
  const persist = usePersistedScore<HockeySave>("hockey");

  const playBuzz = useCallback(async () => {
    const { sound: s } = await Audio.Sound.createAsync(
      require("../../assets/buzzer.mp3")
    );
    setSound(s);
    await s.playAsync();
  }, []);

  const {
    timeLeft,
    isRunning,
    start,
    stop,
    resume,
    reset: resetTimer,
  } = useGameTimer(playBuzz);

  const hockeyCards = useMemo(() => [
    { type: "green", label: "Verte (2 min)", emoji: "🟩", color: "#27ae60", penaltySeconds: 120 },
    { type: "yellow", label: `Jaune (${yellowPenaltyMinutes} min)`, emoji: "🟨", color: "#f1c40f", penaltySeconds: yellowPenaltyMinutes * 60 },
    { type: "red", label: "Rouge (expulsion)", emoji: "🟥", color: "#e74c3c" },
  ], [yellowPenaltyMinutes]);

  const { cards, addCard, resetCards, getActivePenalties } = useCardManager(isRunning);

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
    setCurrentPeriod(1);
    resetTimer();
    resetCards();
  }, [resetTimer, resetCards]);

  const handleAddCard = useCallback((team: "A" | "B", cardType: string) => {
    const cfg = hockeyCards.find((c) => c.type === cardType);
    addCard(team, cardType, cfg?.penaltySeconds);
  }, [addCard, hockeyCards]);

  const handleScore = useCallback((team: "A" | "B", delta: number) => {
    if (team === "A") setScoreA((s) => Math.max(0, s + delta));
    else setScoreB((s) => Math.max(0, s + delta));
  }, []);

  const nextPeriod = useCallback(() => {
    resetTimer();
    if (currentPeriod === 1) setCurrentPeriod(2);
    else if (currentPeriod === 2) setCurrentPeriod(3);
    else if (currentPeriod === 3) {
      if (scoreA !== scoreB) return;
      setCurrentPeriod("OT");
    }
  }, [currentPeriod, scoreA, scoreB, resetTimer]);

  const periodLabel = (p: Period) => {
    if (p === "OT") return "Prolongation";
    return `Période ${p}`;
  };

  const canGoNextPeriod =
    currentPeriod !== "OT" &&
    !(currentPeriod === 3 && scoreA !== scoreB);

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

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
        <Text style={styles.inputTitle}>Durée d'une période (min)</Text>
        <TextInput
          placeholder="Durée d'une période (min)"
          value={periodDuration.toString()}
          onChangeText={(t) => setPeriodDuration(Number(t))}
          style={styles.input}
          keyboardType="numeric"
        />
        <Text style={styles.inputTitle}>Durée pénalité jaune (min)</Text>
        <TextInput
          value={yellowPenaltyMinutes.toString()}
          onChangeText={(t) => setYellowPenaltyMinutes(Number(t))}
          style={styles.input}
          keyboardType="numeric"
        />
      </SettingsModal>

      {/* Burger */}
      <TouchableOpacity style={styles.burger} onPress={() => setShowModal(true)}>
        <MaterialCommunityIcons name="hockey-sticks" size={40} color="white" />
        <Text style={{ fontSize: 40, color: "white" }}>☰</Text>
      </TouchableOpacity>

      {/* Période + Chrono */}
      <View style={styles.timerArea}>
        <Text style={styles.periodLabel}>{periodLabel(currentPeriod)}</Text>

        {/* Chrono */}
        <Text style={styles.timerDisplay}>
          {isRunning || timeLeft > 0 ? formatTime(timeLeft) : formatTime(periodDuration * 60)}
        </Text>

        {/* Contrôles chrono */}
        <View style={styles.timerControls}>
          {!isRunning ? (
            <TouchableOpacity
              style={styles.timerBtn}
              onPress={() => timeLeft > 0 ? resume() : start(periodDuration)}
            >
              <Text style={styles.timerBtnText}>▶ {timeLeft > 0 ? "Reprendre" : "Démarrer"}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.timerBtn, styles.timerBtnPause]} onPress={stop}>
              <Text style={styles.timerBtnText}>⏸ Pause</Text>
            </TouchableOpacity>
          )}
          {canGoNextPeriod && (
            <TouchableOpacity style={[styles.timerBtn, styles.timerBtnNext]} onPress={nextPeriod}>
              <Text style={styles.timerBtnText}>
                {currentPeriod === 3 ? "Prolongation ▶" : `Période ${(currentPeriod as number) + 1} ▶`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Scores */}
      <View style={styles.teamBox}>
        <Text style={styles.teamName}>{teamA}</Text>
        {getActivePenalties("A").length > getActivePenalties("B").length && (
          <Text style={styles.inferiority}>⬇ Infériorité</Text>
        )}
        {getActivePenalties("B").length > getActivePenalties("A").length && (
          <Text style={styles.superiority}>⬆ Supériorité</Text>
        )}
        <CardTracker team="A" cards={cards} cardTypes={hockeyCards} />
        <TouchableOpacity onPress={() => handleScore("A", -1)}>
          <MaterialCommunityIcons name="eraser" size={32} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleScore("A", 1)}>
          <Text style={styles.score}>{scoreA}</Text>
        </TouchableOpacity>
        <CardActionButtons
          team="A"
          teamName={teamA}
          cardTypes={hockeyCards}
          onAddCard={handleAddCard}
        />
      </View>

      <View style={styles.teamBox}>
        <Text style={styles.teamName}>{teamB}</Text>
        {getActivePenalties("B").length > getActivePenalties("A").length && (
          <Text style={styles.inferiority}>⬇ Infériorité</Text>
        )}
        {getActivePenalties("A").length > getActivePenalties("B").length && (
          <Text style={styles.superiority}>⬆ Supériorité</Text>
        )}
        <CardTracker team="B" cards={cards} cardTypes={hockeyCards} />
        <TouchableOpacity onPress={() => handleScore("B", -1)}>
          <MaterialCommunityIcons name="eraser" size={32} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleScore("B", 1)}>
          <Text style={styles.score}>{scoreB}</Text>
        </TouchableOpacity>
        <CardActionButtons
          team="B"
          teamName={teamB}
          cardTypes={hockeyCards}
          onAddCard={handleAddCard}
        />
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
  teamBox: { alignItems: "center", justifyContent: "flex-end", flex: 1, gap: 10 },
  teamName: { fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 10 },
  score: { color: "#fff", fontSize: 120, fontWeight: "bold" },
  burger: { position: "absolute", top: 30, left: "42%", zIndex: 10 },
  timerArea: {
    position: "absolute",
    top: 30,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 5,
  },
  periodLabel: { color: "#aaa", fontSize: 14, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase" },
  timerDisplay: { color: "#fff", fontSize: 36, fontWeight: "bold", marginVertical: 4 },
  timerControls: { flexDirection: "row", gap: 8 },
  timerBtn: {
    backgroundColor: "#1a7a3a",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timerBtnPause: { backgroundColor: "#7a5a1a" },
  timerBtnNext: { backgroundColor: "#1a3a7a" },
  timerBtnText: { color: "#fff", fontSize: 13, fontWeight: "bold" },
  inputTitle: { fontSize: 12, color: "#fff", marginBottom: 2, textAlign: "center" },
  input: { backgroundColor: "#333", color: "#fff", padding: 10, borderRadius: 6, marginBottom: 10 },
  superiority: { fontSize: 12, color: "#2ecc71", fontWeight: "bold" },
  inferiority: { fontSize: 12, color: "#e74c3c", fontWeight: "bold" },
});
