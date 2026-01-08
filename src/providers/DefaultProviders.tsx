import ThemingProviders from '@/src/providers/ThemingProvider'
import React from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import SplashScreenProvider from './SplashScreenProvider'

const DefaultProviders = ({ children }: React.PropsWithChildren) => {
    return (
        <SafeAreaProvider>
            <ThemingProviders>
                <SplashScreenProvider>
                    {children}
                </SplashScreenProvider>
            </ThemingProviders>
        </SafeAreaProvider>
    )
}

export default DefaultProviders