import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { useAudioPlayer } from "expo-audio";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { usePersistedScore } from "@/hooks/usePersistedScore";
import { useGameTimer } from "@/hooks/useGameTimer";
import { useCardManager } from "@/hooks/useCardManager";
import HockeyPenaltyButtons from "@/components/HockeyPenaltyButtons";
import HockeyPenaltyList from "@/components/HockeyPenaltyList";
import ResumeModal from "@/components/ResumeModal";
import SettingsModal from "@/components/SettingsModal";
import { applyScoreDelta } from "@/utils/scoring/common";
import {
  canGoNextPeriod as canAdvancePeriod,
  getStrength,
  nextPeriod as getNextPeriod,
  playersOnIce as countPlayersOnIce,
  type Period,
} from "@/utils/scoring/hockey";

type HockeySave = {
  scoreA: number;
  scoreB: number;
  teamA: string;
  teamB: string;
  currentPeriod?: Period;
  periodDuration?: number;
};

export default function HockeyScore() {
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [teamA, setTeamA] = useState("Équipe A");
  const [teamB, setTeamB] = useState("Équipe B");
  const [showModal, setShowModal] = useState(false);
  const [periodDuration, setPeriodDuration] = useState(20);
  const [currentPeriod, setCurrentPeriod] = useState<Period>(1);
  const buzzer = useAudioPlayer(require("../../assets/buzzer.mp3"));

  const { width, height } = useWindowDimensions();
  const isPortrait = height > width;
  const scoreFont = Math.min(100, height * 0.26);
  const {
    save,
    resume: resumeSave,
    clear: clearSave,
    hasSavedScore,
    isLoaded,
  } = usePersistedScore<HockeySave>("hockey");

  const playBuzz = useCallback(async () => {
    try {
      await buzzer.seekTo(0);
      buzzer.play();
    } catch (e) {
      if (__DEV__) console.warn("Buzzer error:", e);
    }
  }, [buzzer]);

  const {
    timeLeft,
    isRunning,
    start,
    stop,
    resume,
    reset: resetTimer,
  } = useGameTimer(playBuzz);

  const { cards, addCard, resetCards } = useCardManager(isRunning);

  useEffect(() => {
    if (!isLoaded) return;
    save({ scoreA, scoreB, teamA, teamB, currentPeriod, periodDuration });
  }, [scoreA, scoreB, teamA, teamB, currentPeriod, periodDuration, isLoaded, save]);

  const handleResume = useCallback(() => {
    const data = resumeSave();
    if (!data) return;
    setScoreA(data.scoreA);
    setScoreB(data.scoreB);
    setTeamA(data.teamA);
    setTeamB(data.teamB);
    if (data.currentPeriod !== undefined) setCurrentPeriod(data.currentPeriod);
    if (data.periodDuration !== undefined) setPeriodDuration(data.periodDuration);
  }, [resumeSave]);

  const resetScores = useCallback(() => {
    setScoreA(0);
    setScoreB(0);
    setCurrentPeriod(1);
    resetTimer();
    resetCards();
  }, [resetTimer, resetCards]);

  const handleAddPenalty = useCallback(
    (team: "A" | "B", type: string, seconds: number | undefined) => {
      addCard(team, type, seconds);
    },
    [addCard],
  );

  const handleScore = useCallback((team: "A" | "B", delta: number) => {
    if (team === "A") setScoreA((s) => applyScoreDelta(s, delta));
    else setScoreB((s) => applyScoreDelta(s, delta));
  }, []);

  const nextPeriod = useCallback(() => {
    resetTimer();
    const next = getNextPeriod(currentPeriod, scoreA, scoreB);
    if (next !== null) setCurrentPeriod(next);
  }, [currentPeriod, scoreA, scoreB, resetTimer]);

  const canGoNextPeriod = canAdvancePeriod(currentPeriod, scoreA, scoreB);

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

  const periodLabel = (p: Period) =>
    p === "OT" ? "Prolongation" : `Période ${p}`;

  const playersOnIce = (team: "A" | "B") => countPlayersOnIce(cards, team);
  const strengthA = getStrength(cards, "A");
  const strengthB = getStrength(cards, "B");

  return (
    <View style={[styles.container, { paddingTop: isPortrait ? 60 : 10 }]}>
      <ResumeModal
        visible={hasSavedScore}
        onResume={handleResume}
        onDiscard={clearSave}
      />

      <SettingsModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onReset={resetScores}
      >
        <TextInput
          placeholder="Nom équipe A"
          value={teamA}
          onChangeText={setTeamA}
          style={styles.input}
        />
        <TextInput
          placeholder="Nom équipe B"
          value={teamB}
          onChangeText={setTeamB}
          style={styles.input}
        />
        <Text style={styles.inputTitle}>Durée d'une période (min)</Text>
        <TextInput
          value={periodDuration.toString()}
          onChangeText={(t) => {
            const n = Number(t);
            if (!isNaN(n) && n > 0) setPeriodDuration(n);
          }}
          style={styles.input}
          keyboardType="numeric"
        />
      </SettingsModal>

      {/* Burger — right corner, clear of centered timerArea */}
      <TouchableOpacity
        style={styles.burger}
        onPress={() => setShowModal(true)}
      >
        <MaterialCommunityIcons name="hockey-sticks" size={26} color="white" />
        <Text style={styles.burgerText}>☰</Text>
      </TouchableOpacity>

      {/* Période + Chrono */}
      <View style={styles.timerArea}>
        <Text style={styles.periodLabel}>{periodLabel(currentPeriod)}</Text>
        <Text style={styles.timerDisplay}>
          {isRunning || timeLeft > 0
            ? formatTime(timeLeft)
            : formatTime(periodDuration * 60)}
        </Text>
        <View style={styles.timerControls}>
          {!isRunning ? (
            <TouchableOpacity
              style={styles.timerBtn}
              onPress={() => (timeLeft > 0 ? resume() : start(periodDuration))}
            >
              <Text style={styles.timerBtnText}>
                ▶ {timeLeft > 0 ? "Reprendre" : "Démarrer"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.timerBtn, styles.timerBtnPause]}
              onPress={stop}
            >
              <Text style={styles.timerBtnText}>⏸ Pause</Text>
            </TouchableOpacity>
          )}
          {canGoNextPeriod && (
            <TouchableOpacity
              style={[styles.timerBtn, styles.timerBtnNext]}
              onPress={nextPeriod}
            >
              <Text style={styles.timerBtnText}>
                {currentPeriod === 3
                  ? "Prolongation ▶"
                  : `Période ${(currentPeriod as number) + 1} ▶`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Équipe A */}
      <View style={styles.teamBox}>
        <Text style={styles.teamName}>{teamA}</Text>
        <Text style={styles.playersOnIce}>🏒 {playersOnIce("A")} joueurs</Text>
        {strengthA === "superiority" && (
          <Text style={styles.superiority}>⬆ Supériorité</Text>
        )}
        {strengthA === "inferiority" && (
          <Text style={styles.inferiority}>⬇ Infériorité</Text>
        )}
        <HockeyPenaltyList team="A" cards={cards} />
        <TouchableOpacity onPress={() => handleScore("A", -1)}>
          <MaterialCommunityIcons name="eraser" size={32} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleScore("A", 1)}>
          <Text style={[styles.score, { fontSize: scoreFont }]}>{scoreA}</Text>
        </TouchableOpacity>
        <HockeyPenaltyButtons
          team="A"
          teamName={teamA}
          onAddPenalty={handleAddPenalty}
        />
      </View>

      {/* Équipe B */}
      <View style={styles.teamBox}>
        <Text style={styles.teamName}>{teamB}</Text>
        <Text style={styles.playersOnIce}>🏒 {playersOnIce("B")} joueurs</Text>
        {strengthB === "superiority" && (
          <Text style={styles.superiority}>⬆ Supériorité</Text>
        )}
        {strengthB === "inferiority" && (
          <Text style={styles.inferiority}>⬇ Infériorité</Text>
        )}
        <HockeyPenaltyList team="B" cards={cards} />
        <TouchableOpacity onPress={() => handleScore("B", -1)}>
          <MaterialCommunityIcons name="eraser" size={32} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleScore("B", 1)}>
          <Text style={[styles.score, { fontSize: scoreFont }]}>{scoreB}</Text>
        </TouchableOpacity>
        <HockeyPenaltyButtons
          team="B"
          teamName={teamB}
          onAddPenalty={handleAddPenalty}
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
  teamBox: {
    alignItems: "center",
    justifyContent: "flex-end",
    flex: 1,
    gap: 8,
  },
  teamName: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  playersOnIce: { fontSize: 13, color: "#aaa" },
  score: { color: "#fff", fontWeight: "bold" },
  burger: { position: "absolute", top: 30, right: "3%", zIndex: 10, flexDirection: "row", alignItems: "center", gap: 4 },
  burgerText: { fontSize: 26, color: "white" },
  timerArea: {
    position: "absolute",
    top: 30,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 5,
  },
  periodLabel: {
    color: "#aaa",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  timerDisplay: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "bold",
    marginVertical: 4,
  },
  timerControls: { flexDirection: "row", gap: 8 },
  timerBtn: {
    backgroundColor: "#1a7a3a",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: "center",
  },
  timerBtnPause: { backgroundColor: "#7a5a1a" },
  timerBtnNext: { backgroundColor: "#1a3a7a" },
  timerBtnText: { color: "#fff", fontSize: 13, fontWeight: "bold" },
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
  superiority: { fontSize: 12, color: "#2ecc71", fontWeight: "bold" },
  inferiority: { fontSize: 12, color: "#e74c3c", fontWeight: "bold" },
});
