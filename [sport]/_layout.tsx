import { Stack } from "expo-router";

export default function SportLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // ❌ cache le header dans /[sport]/score
      }}
    />
  );
}
