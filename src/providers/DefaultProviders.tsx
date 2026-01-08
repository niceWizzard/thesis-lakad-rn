import ThemingProviders from '@/src/providers/ThemingProvider'
import React from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

const DefaultProviders = ({ children }: React.PropsWithChildren) => {
    return (
        <SafeAreaProvider>
            <ThemingProviders>
                {children}
            </ThemingProviders>
        </SafeAreaProvider>
    )
}

export default DefaultProviders