import { useEffect, useState } from "react";
import { Slot, usePathname } from "expo-router";
import * as NavigationBar from "expo-navigation-bar";
import * as ScreenOrientation from "expo-screen-orientation";
import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from "react-native-google-mobile-ads";

// --- AdMob: vrai unitId en prod, TestIds en dev (depuis ton ancienne app)
const REAL_BANNER_UNIT_ID = "ca-app-pub-8391520865775051/5872519298";
const bannerUnitId = __DEV__ ? TestIds.BANNER : REAL_BANNER_UNIT_ID;

export default function RootLayout() {
  const pathname = usePathname();
  const [orientation, setOrientation] =
    useState<ScreenOrientation.OrientationLock | null>(null);

  useEffect(() => {
    NavigationBar.setVisibilityAsync("hidden");

    const applyInitialOrientation = async () => {
      if (pathname === "/") {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT
        );
      } else {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.LANDSCAPE
        );
      }
      const current = await ScreenOrientation.getOrientationLockAsync();
      setOrientation(current);
    };

    applyInitialOrientation();
  }, [pathname]);

  const toggleOrientation = async () => {
    const current = await ScreenOrientation.getOrientationLockAsync();
    const isLandscape =
      current === ScreenOrientation.OrientationLock.LANDSCAPE ||
      current === ScreenOrientation.OrientationLock.LANDSCAPE_LEFT ||
      current === ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT;

    const newOrientation = isLandscape
      ? ScreenOrientation.OrientationLock.PORTRAIT
      : ScreenOrientation.OrientationLock.LANDSCAPE;

    await ScreenOrientation.lockAsync(newOrientation);
    setOrientation(newOrientation);
  };

  return (
    <View style={{ flex: 1 }}>
      <Slot />

      {/* --- Bandeau publicitaire en bas --- */}
      <View style={styles.bannerContainer}>
        <BannerAd
          unitId={bannerUnitId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          onAdLoaded={() => console.log("Ad loaded")}
          onAdFailedToLoad={(err) => console.log("Ad failed", err)}
        />
      </View>

      {/* --- Bouton rotation --- */}
      <View pointerEvents="box-none" style={styles.overlay}>
        <TouchableOpacity
          style={styles.rotationBtn}
          onPress={toggleOrientation}
        >
          <MaterialCommunityIcons
            name="phone-rotate-portrait"
            size={24}
            color="#5e5555"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingBottom: Platform.OS === "ios" ? 20 : 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    padding: Platform.OS === "android" ? 20 : 30,
  },
  rotationBtn: {
    borderRadius: 24,
    padding: 10,
    elevation: 5,
  },
});
