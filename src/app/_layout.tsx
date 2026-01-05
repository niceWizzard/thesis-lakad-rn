import { Stack } from "expo-router";

import '@/global.css';
import DefaultProviders from "../providers/DefaultProviders";

export const unstable_settings = {
  initialRouteName: '(tabs)/index',
};

export default function RootLayout() {
  return <DefaultProviders>
    <Stack>
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(onboarding)"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  </DefaultProviders>
}
