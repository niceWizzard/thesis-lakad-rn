import SplashScreenProvider from "@/src/providers/SplashScreenProvider";
import { Stack } from "expo-router";

export default function RootLayout() {
  return <SplashScreenProvider>
    <Stack />
  </SplashScreenProvider>;
}
