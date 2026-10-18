import { useCallback } from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import * as ScreenOrientation from "expo-screen-orientation";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

/** Toggles the score screen between portrait and landscape. Sits next to the ☰ menu. */
export default function RotateButton({ size = 26 }: { size?: number }) {
  const toggleOrientation = useCallback(async () => {
    const current = await ScreenOrientation.getOrientationLockAsync();
    const isLandscape =
      current === ScreenOrientation.OrientationLock.LANDSCAPE ||
      current === ScreenOrientation.OrientationLock.LANDSCAPE_LEFT ||
      current === ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT;

    await ScreenOrientation.lockAsync(
      isLandscape
        ? ScreenOrientation.OrientationLock.PORTRAIT
        : ScreenOrientation.OrientationLock.LANDSCAPE
    );
  }, []);

  return (
    <TouchableOpacity
      style={styles.btn}
      onPress={toggleOrientation}
      accessibilityLabel="Changer l'orientation"
    >
      <MaterialCommunityIcons name="phone-rotate-portrait" size={size} color="#aaa" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
});
