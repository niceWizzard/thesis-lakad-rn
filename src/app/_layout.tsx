import { Stack } from "expo-router";

import '@/global.css';
import ConnectivityChecker from "../components/ConnectivityChecker";
import DefaultProviders from "../providers/DefaultProviders";

export const unstable_settings = {
  initialRouteName: '(tabs)/index',
};

export default function RootLayout() {
  return <DefaultProviders>
    <Stack screenOptions={{
      header: ({ route }) => <ConnectivityChecker />,
    }}>
      <Stack.Screen
        name="(tabs)"
        options={{
        }}
      />
      <Stack.Screen
        name="(onboarding)"
        options={{
        }}
      />
    </Stack>
  </DefaultProviders>
}
