import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Mapbox from '@rnmapbox/maps';

import '@/global.css';
import ThemingProviders from '../provider/ThemingProviders';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Initialize mapbox access token
const accessToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? null
if (accessToken == null) {
  throw new Error("Mapbox access token is not defined. Please set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in your environment variables.");
}
Mapbox.setAccessToken(accessToken);

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('@/assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  const [isReady, setIsReady] = useState(false);
  const [initialRouteDetermined, setInitialRouteDetermined] = useState(false);
  const router = useRouter();
  const segments = useSegments();


  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && !initialRouteDetermined) {
      checkOnboardingStatus();
    }
  }, [loaded, initialRouteDetermined]); // Added initialRouteDetermined to dependencies

  const checkOnboardingStatus = async () => {
    try {
      const haveOnboarded = await AsyncStorage.getItem('haveOnboarded');
      console.log("Onboarding status:", haveOnboarded);

      // Prevent multiple redirects
      setInitialRouteDetermined(true);

      if (haveOnboarded === 'true') {
        // Only navigate if we're not already on tabs
        if (segments[0] !== '(tabs)') {
          router.replace('/(tabs)');
        }
      } else {
        // Only navigate if we're not already on onboarding
        if (segments[0] !== '(onboarding)') {
          router.replace('/(onboarding)');
        }
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setInitialRouteDetermined(true);
      // Default to onboarding if there's an error
      if (segments[0] !== '(onboarding)') {
        router.replace('/(onboarding)');
      }
    } finally {
      setIsReady(true);
      SplashScreen.hideAsync();
    }
  };

  if (!loaded || !isReady) {
    return (
      <ThemingProviders>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </ThemingProviders>
    );
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {

  return (
    <ThemingProviders>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(onboarding)/index" />
        <Stack.Screen name="(more)/preferences"
          options={{
            title: 'Preferences',
            headerShown: true,
          }}
        />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen
          name="itinerary/[id]/index"
          options={{
            title: "Itinerary",
            headerShown: true,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name='itinerary/agam'
          options={{
            title: '',
            headerShown: true,
          }}
        />
      </Stack>
    </ThemingProviders>
  );
}