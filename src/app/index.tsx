import { Text } from '@/components/ui/text';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { StorageKey } from '../constants/Key';
import { useAuthStore } from '../stores/useAuth';
import { mmkvStorage } from '../utils/mmkv';
import { supabase } from '../utils/supabase';


const LoadingSplashScreen = () => {

    const [haveLoaded, setHaveLoaded] = useState(false)
    const router = useRouter()
    const { setAuth } = useAuthStore();

    const initialURL = Linking.useLinkingURL();

    useEffect(() => {
        async function prepare() {
            console.log("SPLASH SCREEN LOADING");
            setHaveLoaded(true)
            try {
                if (
                    initialURL && (initialURL.includes('type=recovery') ||
                        initialURL.includes('access_token=') ||
                        initialURL.includes('error='))
                ) {
                    console.log("Initial URL found, returning:",);
                    return; // RootLayout will handle navigation
                }
                console.log("NO INITIAL URL FOUND")
                // Check onboarding status
                const haveOnboarded = mmkvStorage.getBoolean(StorageKey.HaveOnboarded) ?? false;

                if (!haveOnboarded) {
                    return router.replace('/(onboarding)');
                }

                // Check session
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    console.log("!!!!!")
                    console.log("GOING TO SIGN IN")
                    return router.replace('/(auth)/signin');
                }

                setAuth(session);
                router.replace('/(tabs)');

            } catch (error) {
                console.error("Error in splash screen:", error);
                Alert.alert("Something went wrong.");
            }
        }
        if (!haveLoaded)
            prepare();
    }, []);


    return (
        <View className='flex-1 justify-center items-center'>
            <Text>SplashScreen</Text>
        </View>
    )
}

export default LoadingSplashScreen