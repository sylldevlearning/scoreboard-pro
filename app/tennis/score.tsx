import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { usePersistedScore } from "@/hooks/usePersistedScore";
import { useScoreLayout } from "@/hooks/useScoreLayout";
import ResumeModal from "@/components/ResumeModal";
import SettingsModal from "@/components/SettingsModal";
import RotateButton from "@/components/RotateButton";
import TeamPanel from "@/components/TeamPanel";
import {
  applyPoint,
  eraseLastPoint,
  type SnapshotEntry,
  type TennisScore,
  type TennisState,
} from "@/utils/scoring/tennis";

type TennisSave = {
  scoreA: TennisScore; scoreB: TennisScore;
  gamesA: number; gamesB: number;
  setsA: number; setsB: number;
  setsHistory: number[][];
  teamA: string; teamB: string;
  isTieBreak: boolean;
  setsToWin?: number; gamesToWinSet?: number; tieBreakEnabled?: boolean;
};

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
  const [matchWinner, setMatchWinner] = useState<"A" | "B" | null>(null);
  const [snapshotStack, setSnapshotStack] = useState<SnapshotEntry[]>([]);

  const { width, isPortrait, isLandscape, scoreFont } = useScoreLayout();
  const { save, resume: resumeSave, clear: clearSave, hasSavedScore, isLoaded } = usePersistedScore<TennisSave>("tennis");

  useEffect(() => {
    if (!isLoaded) return;
    save({ scoreA, scoreB, gamesA, gamesB, setsA, setsB, setsHistory, teamA, teamB, isTieBreak, setsToWin, gamesToWinSet, tieBreakEnabled });
  }, [scoreA, scoreB, gamesA, gamesB, setsA, setsB, setsHistory, teamA, teamB, isTieBreak, setsToWin, gamesToWinSet, tieBreakEnabled, isLoaded, save]);

  const isMatchOver = setsA >= setsToWin || setsB >= setsToWin;

  const handleResume = useCallback(() => {
    const data = resumeSave();
    if (!data) return;
    setScoreA(data.scoreA); setScoreB(data.scoreB);
    setGamesA(data.gamesA); setGamesB(data.gamesB);
    setSetsA(data.setsA); setSetsB(data.setsB);
    setSetsHistory(data.setsHistory);
    setTeamA(data.teamA); setTeamB(data.teamB);
    setIsTieBreak(data.isTieBreak);
    // Older saves don't have the match settings: keep the current ones.
    if (data.setsToWin !== undefined) setSetsToWin(data.setsToWin);
    if (data.gamesToWinSet !== undefined) setGamesToWinSet(data.gamesToWinSet);
    if (data.tieBreakEnabled !== undefined) setTieBreakEnabled(data.tieBreakEnabled);
    setSnapshotStack([]);
  }, [resumeSave]);

  const resetMatch = useCallback(() => {
    setScoreA(0); setScoreB(0);
    setGamesA(0); setGamesB(0);
    setSetsA(0); setSetsB(0);
    setSetsHistory([]);
    setIsTieBreak(false);
    setSnapshotStack([]);
  }, []);

  const applyState = (s: TennisState) => {
    setScoreA(s.scoreA); setScoreB(s.scoreB);
    setGamesA(s.gamesA); setGamesB(s.gamesB);
    setSetsA(s.setsA); setSetsB(s.setsB);
    setSetsHistory(s.setsHistory);
    setIsTieBreak(s.isTieBreak);
    setMatchWinner(s.matchWinner);
  };

  // Erase last point scored by the given team (see eraseLastPoint).
  const handleErase = (team: "A" | "B") => {
    const { stack, state } = eraseLastPoint(snapshotStack, team);
    if (!state) return;
    applyState(state);
    setSnapshotStack(stack);
  };

  const handlePoint = (team: "A" | "B") => {
    if (isMatchOver) return;
    const current: TennisState = { scoreA, scoreB, gamesA, gamesB, setsA, setsB, setsHistory, isTieBreak, matchWinner };
    setSnapshotStack(prev => [...prev, { by: team, state: current }]);
    applyState(applyPoint(current, team, { gamesToWinSet, setsToWin, tieBreakEnabled }));
  };

  const pad = (text: string, length: number) =>
    text + " ".repeat(Math.max(0, length - text.length));

  // Set scores: under the players in portrait, between them in landscape.
  const nameWidth = Math.max(teamA.length, teamB.length);
  const history = (
    <View style={[styles.historyBox, isLandscape && styles.historyBoxLandscape]}>
      <Text style={styles.historyRow}>
        {pad(teamA, nameWidth)} :{" "}
        {setsHistory.map((s) => s[0]).join("   ")}
      </Text>
      <Text style={styles.historyRow}>
        {pad(teamB, nameWidth)} :{" "}
        {setsHistory.map((s) => s[1]).join("   ")}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: isPortrait ? 60 : 10 }]}>
      <ResumeModal visible={hasSavedScore} onResume={handleResume} onDiscard={clearSave} />

      <SettingsModal visible={showModal} onClose={() => setShowModal(false)} onReset={resetMatch}>
        <TextInput placeholder="Nom Joueur A" value={teamA} onChangeText={setTeamA} style={styles.input} />
        <TextInput placeholder="Nom Joueur B" value={teamB} onChangeText={setTeamB} style={styles.input} />
        <Text style={styles.inputTitle}>Nombre de sets gagnants</Text>
        <TextInput
          placeholder="Nombre de sets gagnants"
          value={String(setsToWin)}
          onChangeText={(text) => { const v = parseInt(text, 10); if (!isNaN(v) && v > 0) setSetsToWin(v); }}
          keyboardType="numeric"
          style={styles.input}
        />
        <Text style={styles.inputTitle}>Nombre de jeux gagnants</Text>
        <TextInput
          placeholder="Jeux pour gagner un set"
          value={String(gamesToWinSet)}
          onChangeText={(text) => { const v = parseInt(text, 10); if (!isNaN(v) && v > 0) setGamesToWinSet(v); }}
          keyboardType="numeric"
          style={styles.input}
        />
        <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 10 }}>
          <Text style={[styles.inputTitle, { flex: 1 }]}>Activer le tie-break</Text>
          <TouchableOpacity
            onPress={() => setTieBreakEnabled(!tieBreakEnabled)}
            style={{ width: 20, height: 20, borderWidth: 1, borderColor: "#fff", backgroundColor: tieBreakEnabled ? "green" : "#fff" }}
          />
        </View>
      </SettingsModal>

      <Modal visible={!!matchWinner} transparent animationType="fade">
        <Pressable style={styles.winOverlay} onPress={() => setMatchWinner(null)}>
          <Pressable style={styles.winBox} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.winTitle}>🏆 Match terminé</Text>
            <Text style={styles.winName}>{matchWinner === "A" ? teamA : teamB} a gagné !</Text>
            <TouchableOpacity style={styles.newGameBtn} onPress={() => { resetMatch(); setMatchWinner(null); }}>
              <Text style={styles.newGameText}>Nouvelle partie</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMatchWinner(null)}>
              <Text style={styles.closeText}>Fermer</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <View style={styles.burger}>
        <RotateButton />
        <TouchableOpacity style={styles.burgerBtn} onPress={() => setShowModal(true)}>
          <MaterialIcons name="sports-tennis" size={26} color="white" />
          <Text style={styles.burgerText}>☰</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.scoresWrapper, isLandscape && styles.scoresWrapperLandscape]}>
        <TeamPanel
          side="A"
          isLandscape={isLandscape}
          title={<Text style={[styles.teamName, isLandscape && styles.teamNameLandscape]} numberOfLines={1}>{teamA}</Text>}
          score={
            <TouchableOpacity onPress={() => handlePoint("A")} style={!isLandscape && styles.scoreContainer}>
              <Text style={[styles.score, { fontSize: scoreFont }]}>{scoreA}</Text>
            </TouchableOpacity>
          }
          meta={<Text style={[styles.sets, isLandscape && styles.setsLandscape]}>Jeux : {gamesA}</Text>}
          actions={
            <TouchableOpacity style={styles.eraseBtn} onPress={() => handleErase("A")}>
              <MaterialCommunityIcons name="eraser" size={22} color="#aaa" />
            </TouchableOpacity>
          }
        />
        {isLandscape && history}
        <TeamPanel
          side="B"
          isLandscape={isLandscape}
          title={<Text style={[styles.teamName, isLandscape && styles.teamNameLandscape]} numberOfLines={1}>{teamB}</Text>}
          score={
            <TouchableOpacity onPress={() => handlePoint("B")} style={!isLandscape && styles.scoreContainer}>
              <Text style={[styles.score, { fontSize: scoreFont }]}>{scoreB}</Text>
            </TouchableOpacity>
          }
          meta={<Text style={[styles.sets, isLandscape && styles.setsLandscape]}>Jeux : {gamesB}</Text>}
          actions={
            <TouchableOpacity style={styles.eraseBtn} onPress={() => handleErase("B")}>
              <MaterialCommunityIcons name="eraser" size={22} color="#aaa" />
            </TouchableOpacity>
          }
        />
      </View>

      {!isLandscape && history}
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
  scoresWrapperLandscape: { alignItems: "stretch", gap: 16, marginTop: 40, paddingBottom: 8 },
  teamName: { fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 10 },
  teamNameLandscape: { marginBottom: 0 },
  scoreContainer: { justifyContent: "center", alignItems: "center", marginVertical: 20 },
  score: { color: "#fff", fontWeight: "bold" },
  sets: { fontSize: 20, color: "#fff", marginTop: 10 },
  setsLandscape: { marginTop: 0 },
  eraseBtn: {
    marginTop: 12,
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  burgerBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  burger: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 8,
    zIndex: 10,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
  },
  burgerText: { fontSize: 26, color: "white" },
  inputTitle: { fontSize: 18, color: "#fff", marginBottom: 2, marginTop: 2, textAlign: "center" },
  input: { color: "#fff", backgroundColor: "#333", padding: 10, borderRadius: 6, marginBottom: 10 },
  historyBox: { paddingBottom: 10, paddingHorizontal: 20 },
  historyBoxLandscape: { alignSelf: "center", paddingBottom: 0, paddingHorizontal: 0 },
  historyRow: { color: "#fff", fontSize: 16, marginVertical: 2, fontFamily: "monospace" },
  winOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center" },
  winBox: { backgroundColor: "#222", padding: 30, borderRadius: 16, width: "80%", alignItems: "center" },
  winTitle: { fontSize: 26, color: "#fff", fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  winName: { fontSize: 22, color: "#4caf50", fontWeight: "bold", marginBottom: 24, textAlign: "center" },
  newGameBtn: { backgroundColor: "#4caf50", paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10, marginBottom: 12, width: "100%", alignItems: "center" },
  newGameText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  closeText: { color: "#aaa", fontSize: 16, textDecorationLine: "underline" },
});
