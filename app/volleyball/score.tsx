// VolleyballScore.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
  Button,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Audio } from "expo-av";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { usePersistedScore } from "@/hooks/usePersistedScore";
import ResumeModal from "@/components/ResumeModal";

type VolleyballSave = {
  scoreA: number; scoreB: number;
  setsA: number; setsB: number;
  timeoutsA: number; timeoutsB: number;
  teamA: string; teamB: string;
  setsHistory: string[];
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
  const [hasSwitchedAt8, setHasSwitchedAt8] = useState(false);
  const [nbSetsToWin, setNbSetsToWin] = useState(3);
  const [tieBreakEnabled, setTieBreakEnabled] = useState(true);

  const persist = usePersistedScore<VolleyballSave>("volleyball");

  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isPortrait = height > width;

  // Auto-save scores to AsyncStorage
  useEffect(() => {
    if (!persist.isLoaded) return;
    persist.save({ scoreA, scoreB, setsA, setsB, timeoutsA, timeoutsB, teamA, teamB, setsHistory });
  }, [scoreA, scoreB, setsA, setsB, timeoutsA, timeoutsB, teamA, teamB, setsHistory, persist.isLoaded]);

  const handleResume = useCallback(() => {
    const data = persist.resume();
    if (!data) return;
    setScoreA(data.scoreA); setScoreB(data.scoreB);
    setSetsA(data.setsA); setSetsB(data.setsB);
    setTimeoutsA(data.timeoutsA); setTimeoutsB(data.timeoutsB);
    setTeamA(data.teamA); setTeamB(data.teamB);
    setSetsHistory(data.setsHistory);
  }, [persist]);

  useEffect(() => {
    return () => {
      sound?.unloadAsync();
    };
  }, [sound]);

  const playBuzz = async () => {
    const { sound } = await Audio.Sound.createAsync(
      require("../../assets/buzzer.mp3")
    );
    setSound(sound);
    await sound.playAsync();
  };

  const startTimeout = useCallback((team: "A" | "B") => {
    if ((team === "A" && timeoutsA === 0) || (team === "B" && timeoutsB === 0))
      return;

    playBuzz();
    setIsTimeout(true);
    setTimer(30);

    timerInterval.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval.current!);
          setIsTimeout(false);
          playBuzz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    if (team === "A") setTimeoutsA((t) => t - 1);
    else setTimeoutsB((t) => t - 1);
  }, [playBuzz, timeoutsA, timeoutsB]);

  const resetScores = useCallback(() => {
    setScoreA(startScore);
    setScoreB(startScore);
    setTimeoutsA(2);
    setTimeoutsB(2);
    setWinner(null);
    setMatchWinner(null);
    setSetsA(0);
    setSetsB(0);
    setSetsHistory([]);
    setHasSwitchedAt8(false);
  }, [startScore]);

  const handleScoreChange = (team: "A" | "B", delta: number) => {
    const newScoreA = team === "A" ? scoreA + delta : scoreA;
    const newScoreB = team === "B" ? scoreB + delta : scoreB;
    setScoreA(newScoreA);
    setScoreB(newScoreB);

    const totalSets = setsA + setsB;
    const isLastSet = tieBreakEnabled && totalSets === nbSetsToWin * 2 - 2;
    const target = isLastSet ? 15 : 25;

    if (
      (newScoreA >= target || newScoreB >= target) &&
      Math.abs(newScoreA - newScoreB) >= 2
    ) {
      const wonByA = newScoreA > newScoreB;
      const newSetsA = wonByA ? setsA + 1 : setsA;
      const newSetsB = wonByA ? setsB : setsB + 1;

      // Ajout à l'historique
      setSetsHistory((prev) => [...prev, `${newScoreA}-${newScoreB}`]);
      setResultatSets(() => [`${newScoreA}-${newScoreB}`]);

      if (newSetsA === nbSetsToWin || newSetsB === nbSetsToWin) {
        const winnerTeam = newSetsA === nbSetsToWin ? teamA : teamB;
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
      setHasSwitchedAt8(false);
    }

    if (isLastSet && tieBreakEnabled) {
      const wasUnder8 = (team === "A" ? scoreA : scoreB) < 8;
      const isNow8 = (team === "A" ? newScoreA : newScoreB) === 8;
      if (wasUnder8 && isNow8 && !hasSwitchedAt8) {
        playBuzz();
        setHasSwitchedAt8(true);
      }
    }
  };

  return (
    <View style={[styles.container, { paddingTop: isPortrait ? 60 : 10 }]}>
      <ResumeModal
        visible={persist.hasSavedScore}
        onResume={handleResume}
        onDiscard={persist.clear}
      />

      {/* Modal paramètres */}
      <Modal visible={showModal} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowModal(false)}
        >
          <Pressable
            style={styles.modalBox}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Paramètres</Text>
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
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <Text style={{ color: "#fff", marginRight: 10 }}>
                Tie-break auto
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: tieBreakEnabled ? "#4caf50" : "#ccc",
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 5,
                }}
                onPress={() => setTieBreakEnabled(!tieBreakEnabled)}
              >
                <Text style={{ color: "#000" }}>
                  {tieBreakEnabled ? "Oui" : "Non"}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalButtons}>
              <Button title="🏠 " onPress={() => router.push("/")} />
              <Button title="🔁 Réinitialiser" onPress={resetScores} />
              <Button title="✅ " onPress={() => setShowModal(false)} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal fin de set */}
      <Modal visible={!!winner} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setWinner(null)}>
          <Pressable
            style={styles.resultBox}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.resultText}>
              Set gagné par {winner}: {resultatSets}{" "}
            </Text>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal fin de match */}
      <Modal visible={!!matchWinner} transparent animationType="fade">
        <Pressable
          style={styles.overlay}
          onPress={() => {
            setMatchWinner(null);
            resetScores(); // Réinitialisation complète après fermeture du message
          }}
        >
          <Pressable
            style={styles.resultBox}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.resultText}>{matchWinner}</Text>
            <Text style={styles.setsRecap}>{setsHistory.join("  ")}</Text>
            <Button title="✅" onPress={() => setMatchWinner(null)} />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Bouton paramètres */}
      <TouchableOpacity
        style={styles.burger}
        onPress={() => setShowModal(true)}
      >
        <FontAwesome5 name="volleyball-ball" size={44} color="white" />
        <Text style={{ fontSize: 44, color: "white" }}>☰</Text>
      </TouchableOpacity>

      {/* Équipes */}
      {[
        ["A", teamA, scoreA, setsA, timeoutsA],
        ["B", teamB, scoreB, setsB, timeoutsB],
      ].map(([team, name, score, sets, timeouts]) => (
        <View key={team} style={styles.teamBox}>
          <Text style={styles.teamName}>{name}</Text>
          <TouchableOpacity
            onPress={() => handleScoreChange(team as "A" | "B", -1)}
          >
            <MaterialCommunityIcons name="eraser" size={32} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleScoreChange(team as "A" | "B", 1)}
            style={styles.scoreContainer}
          >
            <Text style={styles.score}>{score}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => startTimeout(team as "A" | "B")}>
            <Text style={styles.undo}>T ({timeouts})</Text>
          </TouchableOpacity>
          <Text style={styles.sets}>Sets : {sets}</Text>
        </View>
      ))}

      {/* Timer temps mort */}
      {isTimeout && (
        <Text style={[styles.timeoutText, isPortrait && { bottom: 200 }]}>
          ⏳ Temps mort : {timer}s
        </Text>
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
  teamBox: {
    alignItems: "center",
    justifyContent: "flex-end",
    flex: 1,
    gap: 10,
  },
  teamName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  scoreContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  score: {
    color: "#fff",
    fontSize: 120,
    fontWeight: "bold",
  },
  undo: {
    fontSize: 28,
    color: "#fff",
  },
  sets: {
    fontSize: 20,
    color: "#fff",
    marginBottom: 10,
  },
  timeoutText: {
    position: "absolute",
    bottom: 20,
    width: "100%",
    textAlign: "center",
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  burger: {
    position: "absolute",
    top: 30,
    left: "48%",
    zIndex: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#222",
    padding: 20,
    borderRadius: 12,
    width: "80%",
  },
  modalTitle: {
    fontSize: 22,
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
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
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
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
  resultText: {
    color: "#fff",
    fontSize: 24,
    marginBottom: 10,
  },
  setsRecap: {
    color: "#ccc",
    fontSize: 20,
    textAlign: "center",
    marginBottom: 10,
  },
});
