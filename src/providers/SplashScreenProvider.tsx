import { useRootNavigationState, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { StorageKey } from '../constants/Key';
import { mmkvStorage } from '../utils/mmkv';



SplashScreen.preventAutoHideAsync();


const SplashScreenProvider = ({ children }: React.PropsWithChildren) => {
    const [isReady, setIsReady] = useState(false);
    const [hasPreloaded, setHasPreloaded] = useState(false)
    const router = useRouter()
    const segments = useSegments();
    const navigationState = useRootNavigationState()

    async function hideSplashScreen() {
        setIsReady(true);
        setHasPreloaded(true)
        await SplashScreen.hideAsync();
        console.log("splash screen hidden")
    }

    // Add here things to preload during splash screen
    async function beforeSplashScreen() {
        const inOnboardingGroup = segments[0] === '(onboarding)';
        if (!inOnboardingGroup) {
            const haveOnboarded = mmkvStorage.getBoolean(StorageKey.HaveOnboarded) ?? false
            if (!haveOnboarded) {
                console.log("REPLACING TO ONBOARDING")
                router.replace('/(onboarding)')
            }
        }
    }

    useEffect(() => {
        async function prepare() {
            try {
                await beforeSplashScreen();
            } finally {
                await hideSplashScreen()
            }
        }
        if (!hasPreloaded) {
            // Set timeout important to ensure layout have initialized 
            // before navigating away
            setTimeout(() => {
                prepare()
            }, 50)
        }
    }, [])

    if (!isReady) {
        return null
    }

    return children;
}

export default SplashScreenProvider   