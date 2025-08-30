// app/_layout.tsx
import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
// This will set up a stack navigator without headers for all screens.