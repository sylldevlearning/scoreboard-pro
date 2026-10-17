import { ConfigContext } from "expo/config";

export default ({ config }: ConfigContext) => ({
  ...config,
  plugins: [
    "expo-router",
    "expo-screen-orientation",
    "expo-audio",
    "expo-navigation-bar",
    "expo-font",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff",
      },
    ],
    "expo-status-bar",
    "expo-web-browser",
    [
      "react-native-google-mobile-ads",
      {
        // Fallbacks are Google's official sample App IDs: a malformed ID makes
        // the Mobile Ads SDK crash at launch, a sample ID only serves test ads.
        androidAppId:
          process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID ||
          "ca-app-pub-3940256099942544~3347511713",
        iosAppId:
          process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID ||
          "ca-app-pub-3940256099942544~1458002511",
        userTrackingUsageDescription:
          "Cet identifiant sera utilisé pour vous proposer des publicités personnalisées.",
      },
    ],
  ],
});
