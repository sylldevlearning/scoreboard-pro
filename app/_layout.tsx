import { useEffect, useState } from "react";
import { Slot, usePathname } from "expo-router";
import * as NavigationBar from "expo-navigation-bar";
import * as ScreenOrientation from "expo-screen-orientation";
import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

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
