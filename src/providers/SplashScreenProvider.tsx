import { useRootNavigationState, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { StorageKey } from '../constants/Key';
import { useAuthStore } from '../stores/useAuth';
import { mmkvStorage } from '../utils/mmkv';
import { supabase } from '../utils/supabase';



SplashScreen.preventAutoHideAsync();


const SplashScreenProvider = ({ children }: React.PropsWithChildren) => {
    const [isReady, setIsReady] = useState(false);
    const [hasPreloaded, setHasPreloaded] = useState(false)
    const router = useRouter()
    const segments = useSegments();
    const navigationState = useRootNavigationState()
    const { session, setAuth } = useAuthStore()

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session)
                setAuth(session)
        })

    }, [])

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
                router.replace('/(onboarding)')
            }
            const inAuthGroup = segments[0] === '(auth)';
            const { data: retrievedSession } = await supabase.auth.getSession();
            if (!inAuthGroup && !retrievedSession) {
                router.replace('/(auth)/signin')
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
            }, 150)
        }

        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session)
                setAuth(session)
        })

        return () => data.subscription.unsubscribe()
    }, [])

    if (!isReady) {
        return null
    }

    return children;
}

export default SplashScreenProvider   