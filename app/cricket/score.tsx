import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { usePersistedScore } from "@/hooks/usePersistedScore";
import { HEADER_H, useScoreLayout } from "@/hooks/useScoreLayout";
import ResumeModal from "@/components/ResumeModal";
import SettingsModal from "@/components/SettingsModal";
import RotateButton from "@/components/RotateButton";
import TeamPanel from "@/components/TeamPanel";
import { addWicket, correctWicket, getChaseResult, getFinalResult, nextBattingTeam } from "@/utils/scoring/cricket";
import { applyScoreDelta } from "@/utils/scoring/common";

type CricketSave = {
  teamA: string; teamB: string;
  runsA: number; wicketsA: number; oversA: number;
  runsB: number; wicketsB: number; oversB: number;
  currentInning: 1 | 2; battingTeam: "A" | "B";
};

export default function CricketScore() {
  const [teamA, setTeamA] = useState("Équipe A");
  const [teamB, setTeamB] = useState("Équipe B");
  const [startingBattingTeam, setStartingBattingTeam] = useState<"A" | "B">("A");
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
  const [isMatchOver, setIsMatchOver] = useState(false);

  const { save, resume: resumeSave, clear: clearSave, hasSavedScore, isLoaded } = usePersistedScore<CricketSave>("cricket");
  const { width, isPortrait, isLandscape, scoreFont } = useScoreLayout();

  useEffect(() => {
    if (!isLoaded) return;
    save({ teamA, teamB, runsA, wicketsA, oversA, runsB, wicketsB, oversB, currentInning, battingTeam });
  }, [teamA, teamB, runsA, wicketsA, oversA, runsB, wicketsB, oversB, currentInning, battingTeam, isLoaded, save]);

  const handleResume = useCallback(() => {
    const data = resumeSave();
    if (!data) return;
    setTeamA(data.teamA); setTeamB(data.teamB);
    setRunsA(data.runsA); setWicketsA(data.wicketsA); setOversA(data.oversA);
    setRunsB(data.runsB); setWicketsB(data.wicketsB); setOversB(data.oversB);
    setCurrentInning(data.currentInning); setBattingTeam(data.battingTeam);
  }, [resumeSave]);

  const finishMatch = useCallback((result: "A" | "B" | "draw") => {
    setIsMatchOver(true);
    setWinner(result === "draw" ? "Match nul" : result === "A" ? teamA : teamB);
  }, [teamA, teamB]);

  // Second innings ends by itself once the target is passed or the side is all out.
  useEffect(() => {
    if (currentInning !== 2 || isMatchOver) return;
    const chasingA = battingTeam === "A";
    const result = getChaseResult(
      chasingA ? runsA : runsB,
      chasingA ? wicketsA : wicketsB,
      chasingA ? runsB : runsA,
      battingTeam
    );
    if (result) finishMatch(result.winner);
  }, [currentInning, battingTeam, runsA, runsB, wicketsA, wicketsB, isMatchOver, finishMatch]);

  const handleRun = useCallback((team: "A" | "B", run: number) => {
    if (isMatchOver) return;
    if (team === "A") setRunsA((r) => applyScoreDelta(r, run));
    else setRunsB((r) => applyScoreDelta(r, run));
  }, [isMatchOver]);

  const handleWicket = useCallback((team: "A" | "B") => {
    if (isMatchOver) return;
    if (team === "A") setWicketsA(addWicket);
    else setWicketsB(addWicket);
  }, [isMatchOver]);

  const handleOver = useCallback((team: "A" | "B") => {
    if (team === "A") setOversA((o) => o + 1);
    else setOversB((o) => o + 1);
  }, []);

  const handleCorrectionRun = useCallback((team: "A" | "B") => {
    if (team === "A") setRunsA((r) => applyScoreDelta(r, -1));
    else setRunsB((r) => applyScoreDelta(r, -1));
  }, []);

  const handleCorrectionWicket = useCallback((team: "A" | "B") => {
    if (team === "A") setWicketsA(correctWicket);
    else setWicketsB(correctWicket);
  }, []);

  const handleCorrectionOver = useCallback((team: "A" | "B") => {
    if (team === "A") setOversA((o) => applyScoreDelta(o, -1));
    else setOversB((o) => applyScoreDelta(o, -1));
  }, []);

  const endInning = () => {
    if (currentInning === 1) {
      setCurrentInning(2);
      setBattingTeam(nextBattingTeam(battingTeam));
    } else {
      finishMatch(getFinalResult(runsA, runsB));
    }
  };

  const resetMatch = useCallback(() => {
    setRunsA(0); setWicketsA(0); setOversA(0);
    setRunsB(0); setWicketsB(0); setOversB(0);
    setCurrentInning(1);
    setBattingTeam(startingBattingTeam);
    setWinner(null);
    setIsMatchOver(false);
  }, [startingBattingTeam]);

  // Innings info and "end of innings": around the teams in portrait, centre column in landscape.
  const inningInfo = (
    <Text style={[styles.info, isLandscape && styles.infoLandscape]}>
      Inning {currentInning} — Batting : {battingTeam === "A" ? teamA : teamB}
    </Text>
  );
  const endInningButton = (
    <TouchableOpacity onPress={endInning}>
      <Text style={styles.btn}>📦 Fin de manche</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, isLandscape && styles.containerLandscape, { paddingTop: isPortrait ? 60 : HEADER_H }]}>
      <ResumeModal
        visible={hasSavedScore}
        onResume={handleResume}
        onDiscard={clearSave}
      />

      {/* Burger */}
      <View style={[styles.burger, isLandscape && styles.burgerLandscape]}>
        <TouchableOpacity style={isLandscape && styles.burgerBtnLandscape} onPress={() => setShowModal(true)}>
          <MaterialCommunityIcons name="cricket" size={40} color="white" />
          <Text style={{ fontSize: 40, color: "white" }}>☰</Text>
        </TouchableOpacity>
        <RotateButton />
      </View>

      {/* MODAL paramètres */}
      <SettingsModal visible={showModal} onClose={() => setShowModal(false)} onReset={resetMatch}>
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
        <Text style={styles.inputTitle}>Équipe qui bat en premier</Text>
        <View style={styles.teamSelector}>
          <TouchableOpacity
            style={[styles.selectorBtn, startingBattingTeam === "A" && styles.selectorActive]}
            onPress={() => { setStartingBattingTeam("A"); setBattingTeam("A"); setCurrentInning(1); }}
          >
            <Text style={styles.selectorText}>{teamA}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.selectorBtn, startingBattingTeam === "B" && styles.selectorActive]}
            onPress={() => { setStartingBattingTeam("B"); setBattingTeam("B"); setCurrentInning(1); }}
          >
            <Text style={styles.selectorText}>{teamB}</Text>
          </TouchableOpacity>
        </View>
      </SettingsModal>

      {/* Modal gagnant */}
      <Modal visible={!!winner} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setWinner(null)}>
          <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>
              {winner === "Match nul" ? "🤝 Match nul" : `🏆 Gagnant : ${winner}`}
            </Text>
            <TouchableOpacity
              style={styles.newGameBtn}
              onPress={() => { resetMatch(); setWinner(null); }}
            >
              <Text style={styles.newGameText}>Nouvelle partie</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setWinner(null)}>
              <Text style={styles.closeText}>Fermer</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {!isLandscape && inningInfo}

      <View style={isLandscape ? styles.teamsRowLandscape : styles.teamsColumn}>
        <TeamPanel
          side="A"
          isLandscape={isLandscape}
          title={<Text style={styles.teamName} numberOfLines={1}>{teamA}</Text>}
          score={
            isLandscape ? (
              <Text style={[styles.score, { fontSize: scoreFont * 0.6 }]}>{runsA}/{wicketsA}</Text>
            ) : (
              <Text style={styles.score}>🏏 {runsA}/{wicketsA} ({oversA})</Text>
            )
          }
          meta={isLandscape && <Text style={styles.oversLabel}>Overs : {oversA}</Text>}
          actions={battingTeam === "A" && (
            <>
              <View style={[styles.controls, isLandscape && styles.controlsLandscape]}>
                <TouchableOpacity onPress={() => handleRun("A", 1)}><Text style={styles.btn}>+1</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => handleRun("A", 4)}><Text style={styles.btn}>+4</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => handleRun("A", 6)}><Text style={styles.btn}>+6</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => handleWicket("A")}>
                  <MaterialCommunityIcons name="cricket" size={28} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleOver("A")}><Text style={styles.btn}>Over</Text></TouchableOpacity>
              </View>
              <View style={[styles.corrections, isLandscape && styles.controlsLandscape]}>
                <TouchableOpacity onPress={() => handleCorrectionRun("A")} style={styles.corrBtn}>
                  <MaterialCommunityIcons name="eraser" size={18} color="#aaa" />
                  <Text style={styles.corrLabel}>run</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleCorrectionWicket("A")} style={styles.corrBtn}>
                  <MaterialCommunityIcons name="eraser" size={18} color="#aaa" />
                  <Text style={styles.corrLabel}>wkt</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleCorrectionOver("A")} style={styles.corrBtn}>
                  <MaterialCommunityIcons name="eraser" size={18} color="#aaa" />
                  <Text style={styles.corrLabel}>over</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        />
        {isLandscape && (
          <View style={styles.centerCol}>
            {inningInfo}
            {endInningButton}
          </View>
        )}
        <TeamPanel
          side="B"
          isLandscape={isLandscape}
          title={<Text style={styles.teamName} numberOfLines={1}>{teamB}</Text>}
          score={
            isLandscape ? (
              <Text style={[styles.score, { fontSize: scoreFont * 0.6 }]}>{runsB}/{wicketsB}</Text>
            ) : (
              <Text style={styles.score}>🏏 {runsB}/{wicketsB} ({oversB})</Text>
            )
          }
          meta={isLandscape && <Text style={styles.oversLabel}>Overs : {oversB}</Text>}
          actions={battingTeam === "B" && (
            <>
              <View style={[styles.controls, isLandscape && styles.controlsLandscape]}>
                <TouchableOpacity onPress={() => handleRun("B", 1)}><Text style={styles.btn}>+1</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => handleRun("B", 4)}><Text style={styles.btn}>+4</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => handleRun("B", 6)}><Text style={styles.btn}>+6</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => handleWicket("B")}>
                  <MaterialCommunityIcons name="cricket" size={28} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleOver("B")}><Text style={styles.btn}>Over</Text></TouchableOpacity>
              </View>
              <View style={[styles.corrections, isLandscape && styles.controlsLandscape]}>
                <TouchableOpacity onPress={() => handleCorrectionRun("B")} style={styles.corrBtn}>
                  <MaterialCommunityIcons name="eraser" size={18} color="#aaa" />
                  <Text style={styles.corrLabel}>run</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleCorrectionWicket("B")} style={styles.corrBtn}>
                  <MaterialCommunityIcons name="eraser" size={18} color="#aaa" />
                  <Text style={styles.corrLabel}>wkt</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleCorrectionOver("B")} style={styles.corrBtn}>
                  <MaterialCommunityIcons name="eraser" size={18} color="#aaa" />
                  <Text style={styles.corrLabel}>over</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        />
      </View>

      {!isLandscape && endInningButton}
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
  burgerLandscape: { top: 0, flexDirection: "row", alignItems: "center", gap: 6 },
  burgerBtnLandscape: { flexDirection: "row", alignItems: "center", gap: 6 },
  containerLandscape: { padding: 12 },
  teamsColumn: { flex: 1, alignSelf: "stretch", justifyContent: "space-around" },
  teamsRowLandscape: { flex: 1, alignSelf: "stretch", flexDirection: "row", gap: 16, paddingBottom: 8 },
  centerCol: { justifyContent: "center", alignItems: "center", gap: 16, maxWidth: 200 },
  teamName: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  score: { color: "#fff", fontSize: 28 },
  oversLabel: { color: "#ccc", fontSize: 16 },
  controls: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  controlsLandscape: { marginTop: 0, maxWidth: 180 },
  btn: {
    color: "#fff",
    backgroundColor: "#444",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    fontSize: 16,
  },
  info: { color: "#ccc", fontSize: 18, marginBottom: 10 },
  infoLandscape: { marginBottom: 0, textAlign: "center" },
  corrections: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  corrBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  corrLabel: { color: "#aaa", fontSize: 12, fontWeight: "600" },
  inputTitle: { fontSize: 12, color: "#fff", marginBottom: 6, textAlign: "center" },
  input: {
    backgroundColor: "#333",
    color: "#fff",
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
    width: "100%",
  },
  teamSelector: { flexDirection: "row", gap: 10, marginBottom: 12, width: "100%" },
  selectorBtn: {
    flex: 1,
    padding: 10,
    backgroundColor: "#444",
    borderRadius: 6,
    alignItems: "center",
  },
  selectorActive: { backgroundColor: "#1a7a3a", borderWidth: 1, borderColor: "#4caf50" },
  selectorText: { color: "#fff", fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#222",
    padding: 24,
    borderRadius: 16,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: { fontSize: 22, color: "#fff", marginBottom: 20, textAlign: "center" },
  newGameBtn: {
    backgroundColor: "#4caf50",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 12,
    width: "100%",
    alignItems: "center",
  },
  newGameText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  closeText: { color: "#aaa", fontSize: 16, textDecorationLine: "underline" },
});
