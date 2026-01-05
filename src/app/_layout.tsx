import { Stack } from "expo-router";

import '@/global.css';
import DefaultProviders from "../providers/DefaultProviders";

export default function RootLayout() {
  return <DefaultProviders>
    <Stack />
  </DefaultProviders>
}
