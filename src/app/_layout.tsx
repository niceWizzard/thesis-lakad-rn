import SplashScreenProvider from "@/src/providers/SplashScreenProvider";
import { Stack } from "expo-router";

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';

export default function RootLayout() {
  return <GluestackUIProvider>
    <SplashScreenProvider>
      <Stack />
    </SplashScreenProvider>
  </GluestackUIProvider>
}
