import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';


SplashScreen.preventAutoHideAsync();


const SplashScreenProvider = ({ children }: React.PropsWithChildren) => {
    const [isReady, setIsReady] = useState(false);

    async function hideSplashScreen() {
        setIsReady(true);
        await SplashScreen.hideAsync();
        console.log("splash screen hidden")
    }

    useEffect(() => {
        async function prepare() {
            setTimeout(async () => {
                await hideSplashScreen()
            }, 10)
        }
        prepare()
    }, [])

    if (!isReady) {
        return <View style={{ flex: 1, backgroundColor: 'red' }}>
            <Text>You are not suppose to see this!</Text>
        </View>
    }

    return children;
}

export default SplashScreenProvider   