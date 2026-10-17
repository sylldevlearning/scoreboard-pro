// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Mock expo-audio
jest.mock("expo-audio", () => ({
  useAudioPlayer: jest.fn(() => ({
    play: jest.fn(),
    seekTo: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn(),
  })),
}));

// Mock expo-router
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({}),
  Link: ({ children }) => children,
}));

// Mock expo-screen-orientation
jest.mock("expo-screen-orientation", () => ({
  lockAsync: jest.fn(),
  OrientationLock: { LANDSCAPE: "LANDSCAPE", PORTRAIT: "PORTRAIT" },
}));

// Mock react-native-google-mobile-ads
jest.mock("react-native-google-mobile-ads", () => ({
  BannerAd: () => null,
  BannerAdSize: { BANNER: "BANNER" },
  TestIds: { BANNER: "ca-app-pub-test" },
  MobileAds: () => ({ initialize: jest.fn() }),
  AdsConsent: {
    gatherConsent: jest.fn().mockResolvedValue({}),
    getConsentInfo: jest.fn().mockResolvedValue({ canRequestAds: true }),
  },
}));

// Silence act() warnings from async timers in hooks tests
global.console.error = jest.fn((msg) => {
  if (typeof msg === "string" && msg.includes("act(")) return;
  // eslint-disable-next-line no-console
  console.warn(msg);
});
