import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const sports = [
  {
    name: "Volleyball",
    key: "volleyball",
    image: require("../assets/sports/volleyball.jpg"),
  },
  {
    name: "Tennis",
    key: "tennis",
    image: require("../assets/sports/tennis1.jpg"),
  },
  { name: "Rugby", key: "rugby", image: require("../assets/sports/rugby.jpg") },

  {
    name: "Football",
    key: "football",
    image: require("../assets/sports/football.jpg"),
  },
  {
    name: "Basketball",
    key: "basketball",
    image: require("../assets/sports/basketball.jpg"),
  },

  {
    name: "Cricket",
    key: "cricket",
    image: require("../assets/sports/cricket.jpg"),
  },
  {
    name: "Baseball",
    key: "baseball",
    image: require("../assets/sports/baseball.jpg"),
  },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed header */}
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Scoreboard</Text>
      </View>

      {/* Scrollable content */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {sports.map((sport) => (
          <TouchableOpacity
            key={sport.key}
            style={styles.card}
            onPress={() => router.push(`/${sport.key}/score` as any)}
          >
            <Image source={sport.image} style={styles.image} />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.7)"]}
              style={styles.overlay}
            >
              <Text style={styles.label}>{sport.name}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: "#111",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    zIndex: 100,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#111",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  image: {
    width: "100%",
    height: 160,
    resizeMode: "cover",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 12,
    backgroundColor: "linear-gradient(rgba(0,0,0,0) 30%, rgba(0,0,0,0.7) 100%)",
  },

  label: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    textTransform: "uppercase",
  },
});
