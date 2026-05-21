import { useCallback, useEffect } from "react";
import { Slot, usePathname } from "expo-router";
import * as NavigationBar from "expo-navigation-bar";
import * as ScreenOrientation from "expo-screen-orientation";
import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

// react-native-google-mobile-ads requires a compiled native binary.
// In Expo Go / web the TurboModule doesn't exist → load dynamically so the app
// doesn't crash; ads are simply hidden in those environments.
let MobileAds: any = null;
let BannerAd: any = null;
let BannerAdSize: any = null;
let TestIds: any = null;
try {
  const ads = require("react-native-google-mobile-ads");
  MobileAds = ads.default;
  BannerAd = ads.BannerAd;
  BannerAdSize = ads.BannerAdSize;
  TestIds = ads.TestIds;
} catch {}

const REAL_BANNER_UNIT_ID = process.env.EXPO_PUBLIC_ADMOB_BANNER_UNIT_ID ?? "";
const bannerUnitId =
  TestIds && (__DEV__ || !REAL_BANNER_UNIT_ID)
    ? TestIds.BANNER
    : REAL_BANNER_UNIT_ID;

export default function RootLayout() {
  const pathname = usePathname();

  useEffect(() => {
    MobileAds?.().initialize().catch(() => {});
  }, []);

  useEffect(() => {
    NavigationBar.setVisibilityAsync("hidden");

    const applyOrientation = async () => {
      if (pathname === "/") {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT
        );
      } else {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.LANDSCAPE
        );
      }
    };

    applyOrientation();
  }, [pathname]);

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
    <View style={styles.root}>
      <View style={styles.content}>
        <Slot />
      </View>

      {BannerAd && BannerAdSize ? (
        <View style={styles.bannerContainer}>
          <BannerAd
            unitId={bannerUnitId}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          />
        </View>
      ) : null}

      <View pointerEvents="box-none" style={styles.overlay}>
        <TouchableOpacity style={styles.rotationBtn} onPress={toggleOrientation}>
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
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  bannerContainer: {
    alignItems: "center",
    backgroundColor: "#fff",
    paddingBottom: Platform.OS === "ios" ? 20 : 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    padding: Platform.OS === "android" ? 20 : 30,
    // Le paddingBottom laisse la place au banner
    paddingBottom: Platform.OS === "android" ? 80 : 90,
  },
  rotationBtn: {
    borderRadius: 24,
    padding: 10,
    elevation: 5,
  },
});
