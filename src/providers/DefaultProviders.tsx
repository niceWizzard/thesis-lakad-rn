import ThemingProviders from '@/src/providers/ThemingProvider'
import React from 'react'
import SplashScreenProvider from './SplashScreenProvider'

const DefaultProviders = ({ children }: React.PropsWithChildren) => {
    return (
        <ThemingProviders>
            <SplashScreenProvider>
                {children}
            </SplashScreenProvider>
        </ThemingProviders>
    )
}

export default DefaultProviders