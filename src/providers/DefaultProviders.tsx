import ThemingProviders from '@/src/providers/ThemingProvider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { Platform, StatusBar } from 'react-native'
import { CopilotProvider } from "react-native-copilot"
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'

const queryClient = new QueryClient()

const DefaultProviders = ({ children }: React.PropsWithChildren) => {
    return (
        <SafeAreaProvider>
            <GestureHandlerRootView>
                <QueryClientProvider client={queryClient}>
                    <ThemingProviders>
                        <CopilotProvider
                            verticalOffset={Platform.OS === 'android' ? StatusBar.currentHeight : 0}
                        >
                            {children}
                        </CopilotProvider>
                    </ThemingProviders>
                </QueryClientProvider>
            </GestureHandlerRootView>
        </SafeAreaProvider>
    )
}

export default DefaultProviders