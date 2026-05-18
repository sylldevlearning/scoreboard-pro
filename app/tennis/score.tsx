import { useState, useEffect, useCallback } from "react";
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
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { usePersistedScore } from "@/hooks/usePersistedScore";
import ResumeModal from "@/components/ResumeModal";

type TennisSave = {
  scoreA: TennisScore; scoreB: TennisScore;
  gamesA: number; gamesB: number;
  setsA: number; setsB: number;
  setsHistory: number[][];
  teamA: string; teamB: string;
  isTieBreak: boolean;
};

type TennisScore = 0 | 15 | 30 | 40 | "A" | "=";

export default function TennisScore() {
  const [scoreA, setScoreA] = useState<TennisScore>(0);
  const [scoreB, setScoreB] = useState<TennisScore>(0);
  const [teamA, setTeamA] = useState("Joueur A");
  const [teamB, setTeamB] = useState("Joueur B");
  const [showModal, setShowModal] = useState(false);
  const [gamesA, setGamesA] = useState(0);
  const [gamesB, setGamesB] = useState(0);
  const [setsHistory, setSetsHistory] = useState<number[][]>([]);
  const [setsA, setSetsA] = useState(0);
  const [setsB, setSetsB] = useState(0);
  const [setsToWin, setSetsToWin] = useState(2);
  const [gamesToWinSet, setGamesToWinSet] = useState(6);
  const [tieBreakEnabled, setTieBreakEnabled] = useState(true);
  const [isTieBreak, setIsTieBreak] = useState(false);

  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isPortrait = height > width;
  const scoreOrder = [0, 15, 30, 40];
  const persist = usePersistedScore<TennisSave>("tennis");

  useEffect(() => {
    if (!persist.isLoaded) return;
    persist.save({ scoreA, scoreB, gamesA, gamesB, setsA, setsB, setsHistory, teamA, teamB, isTieBreak });
  }, [scoreA, scoreB, gamesA, gamesB, setsA, setsB, setsHistory, teamA, teamB, isTieBreak, persist.isLoaded]);

  const handleResume = useCallback(() => {
    const data = persist.resume();
    if (!data) return;
    setScoreA(data.scoreA); setScoreB(data.scoreB);
    setGamesA(data.gamesA); setGamesB(data.gamesB);
    setSetsA(data.setsA); setSetsB(data.setsB);
    setSetsHistory(data.setsHistory);
    setTeamA(data.teamA); setTeamB(data.teamB);
    setIsTieBreak(data.isTieBreak);
  }, [persist]);

  const resetMatch = () => {
    setScoreA(0);
    setScoreB(0);
    setGamesA(0);
    setGamesB(0);
    setSetsA(0);
    setSetsB(0);
    setSetsHistory([]);
    setIsTieBreak(false);
  };

  const nextScore = (current: TennisScore): TennisScore => {
    const index = scoreOrder.indexOf(current as number);
    return index < scoreOrder.length - 1 ? scoreOrder[index + 1] : 40;
  };

  const handlePoint = (team: "A" | "B") => {
    if (isTieBreak) {
      if (team === "A") setScoreA((prev) => Number(prev) + 1);
      else setScoreB((prev) => Number(prev) + 1);

      const a = team === "A" ? Number(scoreA) + 1 : Number(scoreA);
      const b = team === "B" ? Number(scoreB) + 1 : Number(scoreB);

      if ((a >= 7 || b >= 7) && Math.abs(a - b) >= 2) {
        setIsTieBreak(false);
        finSet(a > b ? gamesA + 1 : gamesA, b > a ? gamesB + 1 : gamesB);
        setScoreA(0);
        setScoreB(0);
      }

      return;
    }

    if (scoreA === 40 && scoreB === 40) {
      if (team === "A") setScoreA("A");
      else setScoreB("A");
      return;
    }

    if (scoreA === "A") {
      if (team === "A") return winGame("A");
      else {
        setScoreA("=");
        setScoreB("=");
        return;
      }
    }

    if (scoreB === "A") {
      if (team === "B") return winGame("B");
      else {
        setScoreA("=");
        setScoreB("=");
        return;
      }
    }

    if (scoreA === "=" || scoreB === "=") {
      if (team === "A") setScoreA("A");
      else setScoreB("A");
      return;
    }

    if (team === "A") setScoreA(nextScore(scoreA));
    else setScoreB(nextScore(scoreB));

    if (scoreA === 40 && team === "A" && scoreB !== 40) winGame("A");
    if (scoreB === 40 && team === "B" && scoreA !== 40) winGame("B");
  };

  const winGame = (team: "A" | "B") => {
    const newGamesA = team === "A" ? gamesA + 1 : gamesA;
    const newGamesB = team === "B" ? gamesB + 1 : gamesB;

    // 👉 1. D’abord : vérifier si on entre en tie-break
    if (
      tieBreakEnabled &&
      newGamesA === gamesToWinSet &&
      newGamesB === gamesToWinSet
    ) {
      setIsTieBreak(true);
      setGamesA(newGamesA);
      setGamesB(newGamesB);
      setScoreA(0);
      setScoreB(0);
      return;
    }

    // 👉 2. Puis : vérifier si un joueur gagne le set (2 jeux d’écart)
    if (
      (newGamesA >= gamesToWinSet || newGamesB >= gamesToWinSet) &&
      Math.abs(newGamesA - newGamesB) >= 2 &&
      !isTieBreak // ✅ ne jamais clore un set ici si on est déjà en tie-break
    ) {
      finSet(newGamesA, newGamesB);
      setScoreA(0);
      setScoreB(0);
      return;
    }

    // 👉 3. Sinon, mise à jour simple
    setGamesA(newGamesA);
    setGamesB(newGamesB);
    setScoreA(0);
    setScoreB(0);
  };

  const finSet = (newGamesA: number, newGamesB: number) => {
    setSetsHistory((prev) => [...prev, [newGamesA, newGamesB]]);

    const teamAGagne = newGamesA > newGamesB;
    if (teamAGagne) setSetsA((prev) => prev + 1);
    else setSetsB((prev) => prev + 1);

    const newSetsA = teamAGagne ? setsA + 1 : setsA;
    const newSetsB = teamAGagne ? setsB : setsB + 1;

    setGamesA(0);
    setGamesB(0);

    if (newSetsA === setsToWin || newSetsB === setsToWin) {
      alert(
        `Match terminé ! ${newSetsA === setsToWin ? teamA : teamB} a gagné.`
      );
      resetMatch();
    }
  };

  const pad = (text: string, length: number) =>
    text + " ".repeat(Math.max(0, length - text.length));

  return (
    <View style={[styles.container, { paddingTop: isPortrait ? 60 : 10 }]}>
      <ResumeModal
        visible={persist.hasSavedScore}
        onResume={handleResume}
        onDiscard={persist.clear}
      />
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
              placeholder="Nom Joueur A"
              value={teamA}
              onChangeText={setTeamA}
              style={styles.input}
            />
            <TextInput
              placeholder="Nom Joueur B"
              value={teamB}
              onChangeText={setTeamB}
              style={styles.input}
            />
            <Text style={styles.inputTitle}>Nombre de sets gagnants</Text>
            <TextInput
              placeholder="Nombre de sets gagnants"
              value={String(setsToWin)}
              onChangeText={(text) => setSetsToWin(Number(text))}
              keyboardType="numeric"
              style={styles.input}
            />
            <Text style={styles.inputTitle}>Nombre de jeux gagnants</Text>
            <TextInput
              placeholder="Jeux pour gagner un set"
              value={String(gamesToWinSet)}
              onChangeText={(text) => setGamesToWinSet(Number(text))}
              keyboardType="numeric"
              style={styles.input}
            />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginVertical: 10,
              }}
            >
              <Text style={[styles.inputTitle, { flex: 1 }]}>
                Activer le tie-break
              </Text>
              <TouchableOpacity
                onPress={() => setTieBreakEnabled(!tieBreakEnabled)}
                style={{
                  width: 20,
                  height: 20,
                  borderWidth: 1,
                  borderColor: "#fff",
                  backgroundColor: tieBreakEnabled ? "green" : "#fff",
                }}
              />
            </View>
            <View style={styles.modalButtons}>
              <Button title="🏠 " onPress={() => router.push("/")} />
              <Button title="🔁 Réinitialiser" onPress={resetMatch} />
              <Button title="✅ " onPress={() => setShowModal(false)} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <TouchableOpacity
        style={styles.burger}
        onPress={() => setShowModal(true)}
      >
        <MaterialIcons name="sports-tennis" size={44} color="white" />
        <Text style={{ fontSize: 44, color: "white" }}>☰</Text>
      </TouchableOpacity>

      <View style={styles.scoresWrapper}>
        <View style={styles.teamBox}>
          <Text style={styles.teamName}>{teamA}</Text>
          <TouchableOpacity
            onPress={() => handlePoint("A")}
            style={styles.scoreContainer}
          >
            <Text style={styles.score}>{scoreA}</Text>
          </TouchableOpacity>
          <Text style={styles.sets}>Jeux : {gamesA}</Text>
        </View>

        <View style={styles.teamBox}>
          <Text style={styles.teamName}>{teamB}</Text>
          <TouchableOpacity
            onPress={() => handlePoint("B")}
            style={styles.scoreContainer}
          >
            <Text style={styles.score}>{scoreB}</Text>
          </TouchableOpacity>
          <Text style={styles.sets}>Jeux : {gamesB}</Text>
        </View>
      </View>

      <View style={styles.historyBox}>
        <Text style={styles.historyRow}>
          {pad(teamA, Math.max(teamA.length, teamB.length))} :{" "}
          {setsHistory.map((s) => s[0]).join("   ")}
        </Text>
        <Text style={styles.historyRow}>
          {pad(teamB, Math.max(teamA.length, teamB.length))} :{" "}
          {setsHistory.map((s) => s[1]).join("   ")}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 10,
    justifyContent: "space-between",
  },
  scoresWrapper: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    flex: 1,
  },
  teamBox: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: 20,
  },
  teamName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  scoreContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  score: {
    color: "#fff",
    fontSize: 120,
    fontWeight: "bold",
  },
  sets: {
    fontSize: 20,
    color: "#fff",
    marginTop: 10,
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
    fontSize: 18,
    color: "#fff",
    marginBottom: 2,
    marginTop: 2,
    textAlign: "center",
  },
  input: {
    color: "#333",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  historyBox: {
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  historyRow: {
    color: "#fff",
    fontSize: 16,
    marginVertical: 2,
    fontFamily: "monospace",
  },
});
