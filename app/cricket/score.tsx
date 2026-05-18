import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function CricketScore() {
  const router = useRouter();

  const [teamA, setTeamA] = useState("Équipe A");
  const [teamB, setTeamB] = useState("Équipe B");

  const [currentInning, setCurrentInning] = useState<1 | 2>(1);
  const [battingTeam, setBattingTeam] = useState<"A" | "B">("A");

  const [runsA, setRunsA] = useState(0);
  const [wicketsA, setWicketsA] = useState(0);
  const [oversA, setOversA] = useState(0);

  const [runsB, setRunsB] = useState(0);
  const [wicketsB, setWicketsB] = useState(0);
  const [oversB, setOversB] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  const { width, height } = useWindowDimensions();
  const isPortrait = height > width;

  const handleRun = (team: "A" | "B", run: number) => {
    if (team === "A") setRunsA((r) => r + run);
    else setRunsB((r) => r + run);
  };

  const handleWicket = (team: "A" | "B") => {
    if (team === "A") {
      if (wicketsA < 10) setWicketsA((w) => w + 1);
    } else {
      if (wicketsB < 10) setWicketsB((w) => w + 1);
    }
  };

  const handleOver = (team: "A" | "B") => {
    if (team === "A") setOversA((o) => o + 1);
    else setOversB((o) => o + 1);
  };

  const endInning = () => {
    if (currentInning === 1) {
      setCurrentInning(2);
      setBattingTeam(battingTeam === "A" ? "B" : "A");
    } else {
      const scoreA = runsA;
      const scoreB = runsB;
      if (scoreA > scoreB) setWinner(teamA);
      else if (scoreB > scoreA) setWinner(teamB);
      else setWinner("Match nul");
    }
  };

  const resetMatch = () => {
    setRunsA(0);
    setWicketsA(0);
    setOversA(0);
    setRunsB(0);
    setWicketsB(0);
    setOversB(0);
    setCurrentInning(1);
    setBattingTeam("A");
    setWinner(null);
  };

  return (
    <View style={styles.container}>
      {/* Burger */}
      <TouchableOpacity
        style={styles.burger}
        onPress={() => setShowModal(true)}
      >
        <MaterialCommunityIcons name="cricket" size={40} color="white" />
        <Text style={{ fontSize: 40, color: "white" }}>☰</Text>
      </TouchableOpacity>

      {/* Modal Config */}
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
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => router.push("/")}>
                <Text style={styles.btn}>🏠</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={resetMatch}>
                <Text style={styles.btn}>🔁</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.btn}>✅</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Winner Modal */}
      <Modal visible={!!winner} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setWinner(null)}>
          <Pressable
            style={styles.modalBox}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>
              {winner === "Match nul" ? "Match nul" : `Gagnant : ${winner}`}
            </Text>
            <TouchableOpacity onPress={() => setWinner(null)}>
              <Text style={styles.btn}>✅</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Équipe en cours */}
      <Text style={styles.info}>
        Inning {currentInning} - Batting : {battingTeam === "A" ? teamA : teamB}
      </Text>

      {/* Équipe A */}
      <View style={styles.teamBox}>
        <Text style={styles.teamName}>{teamA}</Text>
        <Text style={styles.score}>
          🏏 {runsA}/{wicketsA} ({oversA})
        </Text>
        {battingTeam === "A" && currentInning === 1 && (
          <View style={styles.controls}>
            <TouchableOpacity onPress={() => handleRun("A", 1)}>
              <Text style={styles.btn}>+1</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleRun("A", 4)}>
              <Text style={styles.btn}>+4</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleRun("A", 6)}>
              <Text style={styles.btn}>+6</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleWicket("A")}>
              <MaterialCommunityIcons name="cricket" size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleOver("A")}>
              <Text style={styles.btn}>Over</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Équipe B */}
      <View style={styles.teamBox}>
        <Text style={styles.teamName}>{teamB}</Text>
        <Text style={styles.score}>
          🏏 {runsB}/{wicketsB} ({oversB})
        </Text>
        {battingTeam === "B" && currentInning === 2 && (
          <View style={styles.controls}>
            <TouchableOpacity onPress={() => handleRun("B", 1)}>
              <Text style={styles.btn}>+1</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleRun("B", 4)}>
              <Text style={styles.btn}>+4</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleRun("B", 6)}>
              <Text style={styles.btn}>+6</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleWicket("B")}>
              <MaterialCommunityIcons name="cricket" size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleOver("B")}>
              <Text style={styles.btn}>Over</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Fin de manche */}
      <TouchableOpacity onPress={endInning}>
        <Text style={styles.btn}>📦 Fin de manche</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "space-around",
    padding: 20,
  },
  burger: {
    position: "absolute",
    top: 30,
    left: "5%",
    zIndex: 10,
  },
  teamBox: {
    alignItems: "center",
    gap: 10,
  },
  teamName: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  score: {
    color: "#fff",
    fontSize: 28,
  },
  controls: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  btn: {
    color: "#fff",
    backgroundColor: "#444",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    fontSize: 16,
  },
  info: {
    color: "#ccc",
    fontSize: 18,
    marginBottom: 10,
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
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#333",
    color: "#fff",
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
    width: "100%",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 10,
  },
});
