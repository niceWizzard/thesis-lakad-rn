import ThemingProviders from '@/src/providers/ThemingProvider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from "react-native-keyboard-controller"
import { SafeAreaProvider } from 'react-native-safe-area-context'
const queryClient = new QueryClient()

const DefaultProviders = ({ children }: React.PropsWithChildren) => {
    return (
        <SafeAreaProvider>
            <GestureHandlerRootView>
                <QueryClientProvider client={queryClient}>
                    <ThemingProviders>
                        <KeyboardProvider>
                            {children}
                        </KeyboardProvider>
                    </ThemingProviders>
                </QueryClientProvider>
            </GestureHandlerRootView>
        </SafeAreaProvider>
    )
}

export default DefaultProviders