import * as Application from 'expo-application';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';

import { AlertDialog, AlertDialogBackdrop, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader } from '@/components/ui/alert-dialog';
import { Button, ButtonText } from '@/components/ui/button';
import { Center } from '@/components/ui/center';
import { Heading } from '@/components/ui/heading';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { useQueryClient } from '@tanstack/react-query';
import { addNetworkStateListener, getNetworkStateAsync, NetworkState } from 'expo-network';
import { StorageKey } from '../constants/Key';
import { QueryKey } from '../constants/QueryKey';
import { useAuthStore } from '../stores/useAuth';
import { fetchAdminStatus as fetchUserType } from '../utils/fetchAdminStatus';
import { fetchItinerariesOfUser } from '../utils/fetchItineraries';
import { mmkvStorage } from '../utils/mmkv';
import { supabase } from '../utils/supabase';


const LakadSplashImage = require("@/assets/images/lakad-cover.png")

const GITHUB_REPO = 'niceWizzard/thesis-lakad-rn';
const GITHUB_RELEASES_URL = `https://github.com/${GITHUB_REPO}/releases/latest`;
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

/**
 * Compare two semver strings (e.g. "1.2.3" and "1.3.0").
 * Returns true if `current` is strictly less than `latest`.
 */
function isOutdated(current: string, latest: string): boolean {
    const parse = (v: string) =>
        v.replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);

    const [cMaj, cMin, cPat] = parse(current);
    const [lMaj, lMin, lPat] = parse(latest);

    if (lMaj !== cMaj) return lMaj > cMaj;
    if (lMin !== cMin) return lMin > cMin;
    return lPat > cPat;
}

const LoadingSplashScreen = () => {
    const router = useRouter();
    const { setAuth, isForcedRegularMode } = useAuthStore();
    const initialURL = Linking.useLinkingURL();
    const [networkState, setNetworkState] = useState<NetworkState | null>(null);
    const [loadingError, setLoadingError] = useState<Error | null | undefined>()
    const [showUpdateDialog, setShowUpdateDialog] = useState(false);

    const queryClient = useQueryClient();


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
                if (loadingError) {
                    return;
                }
                if (networkState == null)
                    return;
                if (networkState.isInternetReachable === false) {
                    throw new Error("No internet connection. Please try again later.")
                }

                // 2. Check for app updates against GitHub releases
                if (!__DEV__) {
                    try {
                        const response = await fetch(GITHUB_API_URL);
                        if (response.ok) {
                            const releaseData = await response.json();
                            const latestTag: string = releaseData.tag_name ?? '';
                            const currentVersion = Application.nativeApplicationVersion ?? '0.0.0';

                            if (latestTag && isOutdated(currentVersion, latestTag)) {
                                setShowUpdateDialog(true);
                                return; // Block further loading
                            }
                        }
                    } catch {
                        // Non-fatal: if the version check fails, allow the app to continue
                    }
                }



                // 3. Check Onboarding Status
                const haveOnboarded = mmkvStorage.getBoolean(StorageKey.HaveOnboarded) ?? false;
                if (!haveOnboarded) {
                    return router.replace('/(onboarding)');
                }



                // 4. Check Session with Supabase
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) throw error;

                if (!session) {
                    return router.replace('/(auth)/signin');
                }

                // Check for profile existence
                const { data: profiles, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('user_id', session.user.id)

                if (profileError)
                    throw profileError;

                if (!profiles.length) {
                    router.replace('/profile/setup');
                    return;
                }


                const userType = await fetchUserType(session.user.id);
                // 5. Set global auth state and enter the app
                setAuth(session, userType);

                // On dev don't auto switch to admin mode
                if (!__DEV__) {
                    if (userType !== 'Regular' && !isForcedRegularMode) {
                        router.replace('/(admin)/(tabs)/places');
                        return;
                    }
                }


                await queryClient.fetchQuery({
                    queryKey: [QueryKey.ITINERARIES, session.user.id],
                    queryFn: () => fetchItinerariesOfUser(session.user.id),
                    staleTime: 1000 * 60 * 2, // Consider it fresh for 5 minutes
                });

                router.replace('/(tabs)');

            } catch (error: any) {
                console.error("Splash Logic Error:", error);
                setLoadingError(error)
            }
        };

        // Artificial delay for branding visibility (adjust or remove as needed)
        const timer = setTimeout(prepare, 1);
        return () => clearTimeout(timer);
    }, [initialURL, loadingError, networkState, queryClient, router, setAuth, isForcedRegularMode]);

    function handleRetryPress() {
        router.replace('/')
    }

    const brandText = "LAKAD";

    return (
        <View className="flex-1 justify-center items-center">
            <View className="items-center">
                {/* 1. Logo Popup (ZoomIn) */}
                <Animated.View
                    entering={ZoomIn.duration(600).springify()}
                    className="w-28 h-28 bg-white rounded-3xl items-center justify-center mb-4 shadow-xl"
                >
                    <Image
                        source={LakadSplashImage}
                        resizeMode="contain"
                        className="w-full h-full"
                    />
                </Animated.View>

                {/* 2. Text Container sliding from bottom */}
                <View className="flex-row">
                    {brandText.split("").map((letter, index) => (
                        <Animated.View
                            key={index}
                            entering={FadeInDown.delay(600 + (index * 100))
                                .duration(600)
                                .springify()
                                .damping(12)}
                            className="mx-0.5"
                        >
                            <Text className="text-4xl font-bold text-primary-600">
                                {letter}
                            </Text>
                        </Animated.View>
                    ))}
                </View>
            </View>

            {/* Bottom Loader / Error Logic */}
            <View className="absolute bottom-20">
                {loadingError ? (
                    <Center className="w-[300px]">
                        <Heading className='text-error-700'>Something went wrong</Heading>
                        <Text className='text-error-800 text-center'>{loadingError.message}</Text>
                        <Button className='mt-4' onPress={handleRetryPress}>
                            <ButtonText>Retry</ButtonText>
                        </Button>
                    </Center>
                ) : (
                    <Animated.View entering={FadeIn.delay(1200)}>
                        <Spinner size="large" />
                    </Animated.View>
                )}
            </View>

            {/* Update Required Dialog */}
            <AlertDialog isOpen={showUpdateDialog} onClose={() => { /* intentionally non-dismissible */ }}>
                <AlertDialogBackdrop />
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <Heading size="md" className="text-typography-950">
                            Update Required
                        </Heading>
                    </AlertDialogHeader>
                    <AlertDialogBody className="mt-3 mb-4">
                        <Text size="md">
                            A new version of Lakad is available. Please update the app to continue using it.
                        </Text>
                    </AlertDialogBody>
                    <AlertDialogFooter>
                        <Button
                            onPress={() => WebBrowser.openBrowserAsync(GITHUB_RELEASES_URL)}
                        >
                            <ButtonText>Update Now</ButtonText>
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </View>
    );
};

export default LoadingSplashScreen;