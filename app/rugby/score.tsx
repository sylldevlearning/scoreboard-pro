import { useState, useEffect, useRef, useCallback } from "react";
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
import { Audio } from "expo-av";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function RugbyScore() {
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [teamA, setTeamA] = useState("Équipe A");
  const [teamB, setTeamB] = useState("Équipe B");
  const [showModal, setShowModal] = useState(false);
  const [halfDuration, setHalfDuration] = useState(40);
  const [isTraining, setIsTraining] = useState(true);
  const [isHalfRunning, setIsHalfRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<number | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isPortrait = height > width;

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

  const startHalf = () => {
    if (isHalfRunning) return;
    const totalSeconds = halfDuration * 60;
    setTimeLeft(totalSeconds);
    setIsHalfRunning(true);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsHalfRunning(false);
          playBuzz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resetScores = useCallback(() => {
    setScoreA(0);
    setScoreB(0);
    setIsHalfRunning(false);
    setTimeLeft(0);
  }, []);

  const handleScore = useCallback((team: "A" | "B", delta: number) => {
    if (team === "A") setScoreA((s) => Math.max(0, s + delta));
    else setScoreB((s) => Math.max(0, s + delta));
  }, []);

  return (
    <View style={[styles.container, { paddingTop: isPortrait ? 60 : 10 }]}>
      {/* Modal */}
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
            <Text style={styles.inputTitle}>Durée</Text>

            <TextInput
              placeholder="Durée d'une mi-temps (min)"
              value={halfDuration.toString()}
              onChangeText={(t) => setHalfDuration(Number(t))}
              style={styles.input}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={styles.switchBtn}
              onPress={() => setIsTraining((v) => !v)}
            >
              <Text style={styles.switchText}>
                Mode match : {isTraining ? "✅" : "❌"}
              </Text>
            </TouchableOpacity>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => router.push("/")}>
                <Text style={styles.btn}>🏠</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={resetScores}>
                <Text style={styles.btn}>🔁</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.btn}>✅</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Burger */}
      <TouchableOpacity
        style={styles.burger}
        onPress={() => setShowModal(true)}
      >
        <MaterialCommunityIcons name="rugby" size={40} color="white" />
        <Text style={{ fontSize: 40, color: "white" }}>☰</Text>
      </TouchableOpacity>

      {/* Chrono en haut à gauche */}
      {isHalfRunning && (
        <Text style={styles.timerTopLeft}>
          ⏱️ {Math.floor(timeLeft / 60)}:
          {(timeLeft % 60).toString().padStart(2, "0")}
        </Text>
      )}

      {/* Lancer la mi-temps */}
      {isTraining && !isHalfRunning && (
        <TouchableOpacity onPress={startHalf} style={styles.timerTopLeft}>
          <Text style={styles.timerStart}>▶️ </Text>
        </TouchableOpacity>
      )}

      {/* Équipe A */}
      <View style={styles.teamBox}>
        <Text style={styles.teamName}>{teamA}</Text>
        <TouchableOpacity onPress={() => handleScore("A", -1)}>
          <MaterialCommunityIcons name="eraser" size={32} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleScore("A", 1)}>
          <Text style={styles.score}>{scoreA}</Text>
        </TouchableOpacity>
        <View style={styles.row}>
          <TouchableOpacity onPress={() => handleScore("A", 3)}>
            <Text style={styles.btn}>+3</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleScore("A", 5)}>
            <Text style={styles.btn}>+5</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Équipe B */}
      <View style={styles.teamBox}>
        <Text style={styles.teamName}>{teamB}</Text>
        <TouchableOpacity onPress={() => handleScore("B", -1)}>
          <MaterialCommunityIcons name="eraser" size={32} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleScore("B", 1)}>
          <Text style={styles.score}>{scoreB}</Text>
        </TouchableOpacity>
        <View style={styles.row}>
          <TouchableOpacity onPress={() => handleScore("B", 3)}>
            <Text style={styles.btn}>+3</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleScore("B", 5)}>
            <Text style={styles.btn}>+5</Text>
          </TouchableOpacity>
        </View>
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
    gap: 10,
  },
  teamName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  score: {
    color: "#fff",
    fontSize: 120,
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    gap: 20,
    marginTop: 10,
  },
  burger: {
    position: "absolute",
    top: 30,
    left: "48%",
    zIndex: 10,
  },
  timerTopLeft: {
    position: "absolute",
    top: 30,
    left: 20,
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  timerStart: {
    position: "absolute",
    top: 30,
    alignSelf: "center",
    color: "#0f0",
    fontSize: 20,
    fontWeight: "bold",
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
  btn: {
    fontSize: 20,
    color: "#fff",
    backgroundColor: "#444",
    padding: 10,
    borderRadius: 8,
  },
  switchBtn: {
    padding: 10,
    backgroundColor: "#555",
    borderRadius: 6,
    marginBottom: 10,
  },
  switchText: {
    color: "#fff",
    textAlign: "center",
  },
});
