import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Button, ButtonText } from '@/components/ui/button';
import { Center } from '@/components/ui/center';
import { Heading } from '@/components/ui/heading';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { addNetworkStateListener, getNetworkStateAsync, NetworkState } from 'expo-network';
import { StorageKey } from '../constants/Key';
import { useAuthStore } from '../stores/useAuth';
import { useLandmarkStore } from '../stores/useLandmarkStore';
import { fetchLandmarks } from '../utils/fetchLandmarks';
import { mmkvStorage } from '../utils/mmkv';
import { supabase } from '../utils/supabase';

const LoadingSplashScreen = () => {
    const router = useRouter();
    const { setAuth } = useAuthStore();
    const initialURL = Linking.useLinkingURL();
    const [networkState, setNetworkState] = useState<NetworkState | null>(null);
    const [loadingError, setLoadingError] = useState<Error | null | undefined>()
    const setLandmarks = useLandmarkStore(v => v.setLandmarks);

    useEffect(() => {
        getNetworkStateAsync().then(setNetworkState);
        const networkListener = addNetworkStateListener(setNetworkState);
        return () => networkListener.remove();
    }, [])

    useEffect(() => {
        const prepare = async () => {
            try {
                // 1. Prioritize Deep Links (Reset Password, Email Confirmation)
                if (initialURL && (
                    initialURL.includes('type=recovery') ||
                    initialURL.includes('access_token=') ||
                    initialURL.includes('error=')
                )) {
                    // We stay on splash or let RootLayout handle the redirect
                    return;
                }
                console.log(loadingError)
                if (loadingError) {
                    return;
                }
                if (networkState == null)
                    return;
                if (networkState.isInternetReachable == false) {
                    throw new Error("No internet connection. Please try again later.")
                }

                // 2. Check Onboarding Status
                const haveOnboarded = mmkvStorage.getBoolean(StorageKey.HaveOnboarded) ?? false;
                if (!haveOnboarded) {
                    return router.replace('/(onboarding)');
                }

                // 3. Check Session with Supabase
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) throw error;

                if (!session) {
                    return router.replace('/(auth)/signin');
                }

                // 4. Set global auth state and enter the app
                setAuth(session);

                const landmarks = await fetchLandmarks();
                setLandmarks(landmarks);

                router.replace('/(tabs)');

            } catch (error: any) {
                console.error("Splash Logic Error:", error);
                setLoadingError(error)
            }
        };

        // Artificial delay for branding visibility (adjust or remove as needed)
        const timer = setTimeout(prepare, 1500);
        return () => clearTimeout(timer);
    }, [initialURL, networkState]);

    function handleRetryPress() {
        router.replace('/')
    }

    return (
        <View className="flex-1 justify-center items-center">
            <Animated.View
                entering={FadeIn.duration(800)}
                className="items-center"
            >
                {/* Brand Logo Placeholder */}
                <View className="w-24 h-24 bg-white rounded-3xl items-center justify-center mb-6 shadow-lg">
                    <Heading size="3xl" className="text-primary-600">L</Heading>
                </View>

                <Heading size="3xl" className="text-white font-bold tracking-widest">
                    LAKAD
                </Heading>

                <Text className="text-primary-100 mt-2 font-medium">
                    Smart Itinerary Planner
                </Text>
            </Animated.View>

            {/* Bottom Loader */}
            {
                loadingError ? (
                    <Center className="w-[300px] h-[150px] mt-12">
                        <Heading className='text-error-700'>Something went wrong</Heading>
                        <Text className='text-error-800'>{loadingError.message}</Text>
                        <Button className='mt-4' onPress={handleRetryPress}>
                            <ButtonText>Retry</ButtonText>
                        </Button>
                    </Center>
                ) : (
                    <Center className="w-[300px] h-[150px]">
                        <Spinner size="large" />
                    </Center>
                )
            }

        </View>
    );
};

export default LoadingSplashScreen;