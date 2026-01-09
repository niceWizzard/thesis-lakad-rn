import { Stack, useRouter } from "expo-router";

import '@/global.css';
import Mapbox from '@rnmapbox/maps';
import * as Linking from 'expo-linking';
import { useEffect } from "react";
import ConnectivityStatusBar from "../components/ConnectivityChecker";
import DefaultProviders from "../providers/DefaultProviders";
import { useAuthStore } from "../stores/useAuth";
import { supabase } from "../utils/supabase";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN!)

export default function RootLayout() {

  const router = useRouter()
  const { setAuth } = useAuthStore();


  useEffect(() => {
    // 1. Unified URL Logic
    const handleDeepLink = (url: string | null) => {
      if (!url) return;
      console.log("++++")
      console.log("EVENT URL:", url);

      if (url.includes('error=')) {
        console.log("GOING TO LINK ERROR")
        router.replace("/link-error");
        return;
      }
    };

    // 2. Handle the "Cold Start" (App was closed)
    Linking.getInitialURL().then((url) => {
      handleDeepLink(url);
    });

    // 3. Handle the "Warm Start" (App was in background)
    const linkingSubscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    // 4. Handle Auth State
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("SUPABASE EVENT: <", event)
      if (session) {
        setAuth(session);
        // ONLY redirect to tabs if it's a standard login, 
        // NOT a password recovery flow.
        if (event === 'SIGNED_IN') {
          // Optional: logic to check if we are currently on the reset-password screen
        }
      }
    });

    return () => {
      authSubscription.unsubscribe();
      linkingSubscription.remove();
    };
  }, []);

  return <DefaultProviders>
    <Stack screenOptions={{
      headerShown: false,
    }} >
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
    <ConnectivityStatusBar />
  </DefaultProviders>
}
