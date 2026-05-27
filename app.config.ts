import { ConfigContext } from "expo/config";

export default ({ config }: ConfigContext) => ({
  ...config,
  plugins: [
    "expo-router",
    "expo-screen-orientation",
    "expo-av",
    "expo-navigation-bar",
    [
      "react-native-google-mobile-ads",
      {
        androidAppId:
          process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID ??
          "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX",
        iosAppId:
          process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID ??
          "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX",
        userTrackingUsageDescription:
          "Cet identifiant sera utilisé pour vous proposer des publicités personnalisées.",
      },
    ],
  ],
});
