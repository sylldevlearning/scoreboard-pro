import { useEffect, useState } from "react";
import { Slot, usePathname } from "expo-router";
import * as NavigationBar from "expo-navigation-bar";
import * as ScreenOrientation from "expo-screen-orientation";
import { View, StyleSheet, Platform, useWindowDimensions } from "react-native";
import { ContentSizeContext } from "@/hooks/useScoreLayout";

// react-native-google-mobile-ads requires a compiled native binary.
// In Expo Go / web the TurboModule doesn't exist → load dynamically so the app
// doesn't crash; ads are simply hidden in those environments.
let MobileAds: any = null;
let BannerAd: any = null;
let BannerAdSize: any = null;
let TestIds: any = null;
let AdsConsent: any = null;
try {
  const ads = require("react-native-google-mobile-ads");
  MobileAds = ads.default;
  BannerAd = ads.BannerAd;
  BannerAdSize = ads.BannerAdSize;
  TestIds = ads.TestIds;
  AdsConsent = ads.AdsConsent;
} catch {}

/**
 * GDPR: asks Google's UMP SDK for consent (it shows the form only when needed,
 * e.g. first launch in the EEA, and stores the choice itself), then reports
 * whether ads may be requested. A failed update falls back to the stored choice.
 */
async function gatherAdsConsent(): Promise<boolean> {
  if (!AdsConsent) return false;
  try {
    await AdsConsent.gatherConsent();
  } catch (e) {
    if (__DEV__) console.warn("Ads consent error:", e);
  }
  try {
    const info = await AdsConsent.getConsentInfo();
    return info.canRequestAds === true;
  } catch {
    return false;
  }
}

// Real ads only in the EAS "production" profile (EXPO_PUBLIC_APP_ENV is set in
// eas.json). Dev, preview and local builds always get test ads so testers'
// clicks can't get the AdMob account banned.
const IS_PRODUCTION_BUILD =
  !__DEV__ && process.env.EXPO_PUBLIC_APP_ENV === "production";
const REAL_BANNER_UNIT_ID = process.env.EXPO_PUBLIC_ADMOB_BANNER_UNIT_ID ?? "";
const bannerUnitId =
  TestIds && (!IS_PRODUCTION_BUILD || !REAL_BANNER_UNIT_ID)
    ? TestIds.BANNER
    : REAL_BANNER_UNIT_ID;

export default function RootLayout() {
  const pathname = usePathname();
  const [canShowAds, setCanShowAds] = useState(false);
  const [contentSize, setContentSize] = useState<{ width: number; height: number } | null>(null);
  const { width, height } = useWindowDimensions();
  // In landscape the adaptive banner is much taller than in portrait; the
  // fixed 320×50 one leaves more room for the scores.
  const bannerSize = width > height ? BannerAdSize?.BANNER : BannerAdSize?.ANCHORED_ADAPTIVE_BANNER;

  // Consent first, then initialize the SDK and load ads.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!(await gatherAdsConsent()) || cancelled) return;
      try {
        await MobileAds?.().initialize();
      } catch (e) {
        if (__DEV__) console.warn("MobileAds init error:", e);
      }
      if (!cancelled) setCanShowAds(true);
    })();
    return () => { cancelled = true; };
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

  return (
    <View style={styles.root}>
      <View
        style={styles.content}
        onLayout={(e) => {
          const { width: w, height: h } = e.nativeEvent.layout;
          setContentSize({ width: w, height: h });
        }}
      >
        <ContentSizeContext.Provider value={contentSize}>
          <Slot />
        </ContentSizeContext.Provider>
      </View>

      {canShowAds && BannerAd && BannerAdSize ? (
        <View style={styles.bannerContainer}>
          <BannerAd key={bannerSize} unitId={bannerUnitId} size={bannerSize} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  content: {
    flex: 1,
  },
  bannerContainer: {
    alignItems: "center",
    backgroundColor: "#000",
    paddingBottom: Platform.OS === "ios" ? 20 : 0,
  },
});
