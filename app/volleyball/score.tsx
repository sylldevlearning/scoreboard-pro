import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
} from "react-native";
import { useAudioPlayer } from "expo-audio";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { usePersistedScore } from "@/hooks/usePersistedScore";
import { HEADER_H, useScoreLayout } from "@/hooks/useScoreLayout";
import { useCardManager } from "@/hooks/useCardManager";
import type { CardTypeConfig } from "@/hooks/useCardManager";
import CardTracker from "@/components/CardTracker";
import CardActionButtons from "@/components/CardActionButtons";
import ResumeModal from "@/components/ResumeModal";
import SettingsModal from "@/components/SettingsModal";
import RotateButton from "@/components/RotateButton";
import TeamPanel from "@/components/TeamPanel";
import { getSetTarget, isMatchWon, isSetWon } from "@/utils/scoring/volleyball";

const VOLLEYBALL_CARDS: CardTypeConfig[] = [
  { type: "yellow", label: "Avertissement", emoji: "🟨", color: "#f1c40f" },
  { type: "red", label: "Point adverse (+1)", emoji: "🟥", color: "#e74c3c" },
  { type: "red_yellow", label: "Expulsion", emoji: "🟥🟨", color: "#e67e22" },
];

type VolleyballSave = {
  scoreA: number; scoreB: number;
  setsA: number; setsB: number;
  timeoutsA: number; timeoutsB: number;
  teamA: string; teamB: string;
  setsHistory: string[];
  nbSetsToWin?: number; tieBreakEnabled?: boolean; startScore?: number;
};

export default function VolleyballScore() {
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [startScore, setStartScore] = useState(0);
  const [teamA, setTeamA] = useState("Équipe A");
  const [teamB, setTeamB] = useState("Équipe B");
  const [showModal, setShowModal] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [matchWinner, setMatchWinner] = useState<string | null>(null);
  const [timeoutsA, setTimeoutsA] = useState(2);
  const [timeoutsB, setTimeoutsB] = useState(2);
  const [isTimeout, setIsTimeout] = useState(false);
  const [timer, setTimer] = useState(30);
  const [setsA, setSetsA] = useState(0);
  const [setsB, setSetsB] = useState(0);
  const [setsHistory, setSetsHistory] = useState<string[]>([]);
  const [resultatSets, setResultatSets] = useState<string[]>([]);
  const [nbSetsToWin, setNbSetsToWin] = useState(3);
  const [tieBreakEnabled, setTieBreakEnabled] = useState(true);

  const { save, resume: resumeSave, clear: clearSave, hasSavedScore, isLoaded } = usePersistedScore<VolleyballSave>("volleyball");
  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const buzzer = useAudioPlayer(require("../../assets/buzzer.mp3"));

  useEffect(() => {
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, []);

  const { cards, addCard, resetCards } = useCardManager();
  const { width, isPortrait, isLandscape, scoreFont } = useScoreLayout();

  useEffect(() => {
    if (!isLoaded) return;
    save({ scoreA, scoreB, setsA, setsB, timeoutsA, timeoutsB, teamA, teamB, setsHistory, nbSetsToWin, tieBreakEnabled, startScore });
  }, [scoreA, scoreB, setsA, setsB, timeoutsA, timeoutsB, teamA, teamB, setsHistory, nbSetsToWin, tieBreakEnabled, startScore, isLoaded, save]);

  const isMatchOver = isMatchWon(setsA, setsB, nbSetsToWin);

  const handleResume = useCallback(() => {
    const data = resumeSave();
    if (!data) return;
    setScoreA(data.scoreA); setScoreB(data.scoreB);
    setSetsA(data.setsA); setSetsB(data.setsB);
    setTimeoutsA(data.timeoutsA); setTimeoutsB(data.timeoutsB);
    setTeamA(data.teamA); setTeamB(data.teamB);
    setSetsHistory(data.setsHistory);
    // Older saves don't have the match settings: keep the current ones.
    if (data.nbSetsToWin !== undefined) setNbSetsToWin(data.nbSetsToWin);
    if (data.tieBreakEnabled !== undefined) setTieBreakEnabled(data.tieBreakEnabled);
    if (data.startScore !== undefined) setStartScore(data.startScore);
  }, [resumeSave]);

  const playBuzz = useCallback(async () => {
    try {
      await buzzer.seekTo(0);
      buzzer.play();
    } catch (e) {
      if (__DEV__) console.warn("Buzzer error:", e);
    }
  }, [buzzer]);

  const startTimeout = useCallback((team: "A" | "B") => {
    // The ref check also catches a double tap faster than the re-render.
    if (isTimeout || timerInterval.current) return;
    if ((team === "A" && timeoutsA === 0) || (team === "B" && timeoutsB === 0)) return;

    playBuzz();
    setIsTimeout(true);
    setTimer(30);

    timerInterval.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 0) return 0;
        if (prev === 1) {
          clearInterval(timerInterval.current!);
          timerInterval.current = null;
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
    if (timerInterval.current) clearInterval(timerInterval.current);
    timerInterval.current = null;
    setIsTimeout(false);
    setScoreA(startScore);
    setScoreB(startScore);
    setTimeoutsA(2);
    setTimeoutsB(2);
    setWinner(null);
    setMatchWinner(null);
    setSetsA(0);
    setSetsB(0);
    setSetsHistory([]);
    resetCards();
  }, [startScore, resetCards]);

  const handleScoreChange = useCallback((team: "A" | "B", delta: number) => {
    if (isMatchOver) return;
    const newScoreA = team === "A" ? scoreA + delta : scoreA;
    const newScoreB = team === "B" ? scoreB + delta : scoreB;
    setScoreA(newScoreA);
    setScoreB(newScoreB);

    const target = getSetTarget(setsA, setsB, nbSetsToWin, tieBreakEnabled);

    if (isSetWon(newScoreA, newScoreB, target)) {
      const wonByA = newScoreA > newScoreB;
      const newSetsA = wonByA ? setsA + 1 : setsA;
      const newSetsB = wonByA ? setsB : setsB + 1;

      setSetsHistory((prev) => [...prev, `${newScoreA}-${newScoreB}`]);
      setResultatSets(() => [`${newScoreA}-${newScoreB}`]);

      if (isMatchWon(newSetsA, newSetsB, nbSetsToWin)) {
        const winnerTeam = newSetsA >= nbSetsToWin ? teamA : teamB;
        setMatchWinner(`${winnerTeam} gagne ${newSetsA}-${newSetsB}`);
      } else {
        setWinner(wonByA ? teamA : teamB);
      }

      setSetsA(newSetsA);
      setSetsB(newSetsB);
      setScoreA(startScore);
      setScoreB(startScore);
      setTimeoutsA(2);
      setTimeoutsB(2);
    }
  }, [isMatchOver, scoreA, scoreB, setsA, setsB, tieBreakEnabled, nbSetsToWin, teamA, teamB, startScore]);

  const handleAddCard = useCallback((team: "A" | "B", cardType: string) => {
    addCard(team, cardType);
    if (cardType === "red") {
      handleScoreChange(team === "A" ? "B" : "A", 1);
    }
  }, [addCard, handleScoreChange]);

  return (
    <View style={styles.container}>
      <ResumeModal visible={hasSavedScore} onResume={handleResume} onDiscard={clearSave} />

      <SettingsModal visible={showModal} onClose={() => setShowModal(false)} onReset={resetScores}>
        <TextInput placeholder="Nom équipe A" value={teamA} onChangeText={setTeamA} style={styles.input} />
        <TextInput placeholder="Nom équipe B" value={teamB} onChangeText={setTeamB} style={styles.input} />
        <Text style={styles.inputTitle}>Score de départ</Text>
        <TextInput
          keyboardType="number-pad"
          value={String(startScore)}
          onChangeText={(text) => {
            const val = Number(text);
            setStartScore(val);
            setScoreA(val);
            setScoreB(val);
          }}
          style={styles.input}
        />
        <Text style={styles.inputTitle}>Sets gagnants</Text>
        <TextInput
          keyboardType="number-pad"
          value={String(nbSetsToWin)}
          onChangeText={(text) => setNbSetsToWin(Number(text))}
          style={styles.input}
        />
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
          <Text style={{ color: "#fff", marginRight: 10 }}>Tie-break auto</Text>
          <TouchableOpacity
            style={{
              backgroundColor: tieBreakEnabled ? "#4caf50" : "#ccc",
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 5,
            }}
            onPress={() => setTieBreakEnabled(!tieBreakEnabled)}
          >
            <Text style={{ color: "#000" }}>{tieBreakEnabled ? "Oui" : "Non"}</Text>
          </TouchableOpacity>
        </View>
      </SettingsModal>

      {/* Modal fin de set */}
      <Modal visible={!!winner} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setWinner(null)}>
          <Pressable style={styles.resultBox} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.resultText}>Set gagné par {winner}: {resultatSets}</Text>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal fin de match */}
      <Modal visible={!!matchWinner} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => { setMatchWinner(null); resetScores(); }}>
          <Pressable style={styles.resultBox} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.resultText}>{matchWinner}</Text>
            <Text style={styles.setsRecap}>{setsHistory.join("  ")}</Text>
            <TouchableOpacity onPress={() => setMatchWinner(null)}>
              <Text style={styles.closeBtnText}>✅</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Header */}
      <View style={[styles.header, { paddingTop: isPortrait ? 30 : 6 }]}>
        <View style={{ flex: 1 }} />
        <RotateButton />
        <TouchableOpacity style={styles.burger} onPress={() => setShowModal(true)}>
          <FontAwesome5 name="volleyball-ball" size={26} color="white" />
          <Text style={styles.burgerText}>☰</Text>
        </TouchableOpacity>
      </View>

      {/* Timeout banner */}
      {isTimeout && (
        <View style={styles.timeoutBanner}>
          <Text style={styles.timeoutText}>⏳ Temps mort : {timer}s</Text>
        </View>
      )}

      {/* Teams */}
      <View style={[styles.teamsRow, isLandscape && styles.teamsRowLandscape]}>
        {([
          ["A", teamA, scoreA, setsA, timeoutsA],
          ["B", teamB, scoreB, setsB, timeoutsB],
        ] as const).map(([team, name, score, sets, timeouts]) => (
          <TeamPanel
            key={team}
            side={team}
            isLandscape={isLandscape}
            title={<Text style={styles.teamName} numberOfLines={1}>{name}</Text>}
            info={<CardTracker team={team} cards={cards} cardTypes={VOLLEYBALL_CARDS} />}
            scoreAside={
              <TouchableOpacity onPress={() => handleScoreChange(team, -1)}>
                <MaterialCommunityIcons name="eraser" size={32} color="white" />
              </TouchableOpacity>
            }
            score={
              <TouchableOpacity
                onPress={() => handleScoreChange(team, 1)}
                style={!isLandscape && styles.scoreContainer}
              >
                <Text style={[styles.score, { fontSize: scoreFont }]}>{score}</Text>
              </TouchableOpacity>
            }
            meta={<Text style={[styles.sets, isLandscape && styles.setsLandscape]}>Sets : {sets}</Text>}
            actions={
              <>
                <TouchableOpacity
                  disabled={isTimeout}
                  style={isTimeout && styles.disabled}
                  onPress={() => startTimeout(team)}
                >
                  <Text style={styles.undo}>T ({timeouts})</Text>
                </TouchableOpacity>
                <CardActionButtons
                  team={team}
                  teamName={name}
                  cardTypes={VOLLEYBALL_CARDS}
                  onAddCard={handleAddCard}
                />
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
  teamsRowLandscape: { alignItems: "stretch", gap: 24, paddingHorizontal: 16, paddingBottom: 8 },
  teamName: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  scoreContainer: { flexGrow: 1, justifyContent: "center" },
  score: { color: "#fff", fontWeight: "bold" },
  undo: { fontSize: 28, color: "#fff" },
  disabled: { opacity: 0.4 },
  sets: { fontSize: 20, color: "#fff", marginBottom: 10 },
  setsLandscape: { marginBottom: 0 },
  inputTitle: { fontSize: 12, color: "#fff", marginBottom: 2, textAlign: "center" },
  input: { backgroundColor: "#333", color: "#fff", padding: 10, borderRadius: 6, marginBottom: 10 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  resultBox: {
    backgroundColor: "#222",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  resultText: { color: "#fff", fontSize: 24, marginBottom: 10 },
  setsRecap: { color: "#ccc", fontSize: 20, textAlign: "center", marginBottom: 10 },
  closeBtnText: { fontSize: 24, color: "#fff" },
});
