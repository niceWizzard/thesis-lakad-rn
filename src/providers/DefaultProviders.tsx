import ThemingProviders from '@/src/providers/ThemingProvider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'


const queryClient = new QueryClient()

const DefaultProviders = ({ children }: React.PropsWithChildren) => {
    return (
        <SafeAreaProvider>
            <QueryClientProvider client={queryClient}>
                <ThemingProviders>
                    {children}
                </ThemingProviders>
            </QueryClientProvider>
        </SafeAreaProvider>
    )
}

export default DefaultProviders