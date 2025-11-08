import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { useColorScheme } from 'nativewind'
import React from 'react'

const ThemingProviders = ({ children }: React.PropsWithChildren) => {
    const { colorScheme } = useColorScheme();

    return (
        <GluestackUIProvider mode={"system"}>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                {children}
            </ThemeProvider>
        </GluestackUIProvider>
    )
}

export default ThemingProviders