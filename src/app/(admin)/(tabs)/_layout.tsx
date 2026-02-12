import { Tabs } from 'expo-router'
import { Ellipsis, MapPinHouse, MapPinned, Navigation } from 'lucide-react-native'
import React from 'react'
import { useColorScheme } from 'react-native'
import { primaryColorDark, primaryColorLight, TabIcon } from '../../(tabs)/_layout'

const AdminTabsLayout = () => {
    const colorScheme = useColorScheme();
    const primaryColor = colorScheme === 'dark' ? primaryColorDark : primaryColorLight;
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: primaryColor,
            }}
        >
            <Tabs.Screen
                name='explore'
                options={{
                    tabBarIcon: TabIcon(Navigation),
                    headerShown: false,
                    tabBarLabel: "Explore"
                }}
            />
            <Tabs.Screen
                name='landmarks'
                options={{
                    tabBarIcon: TabIcon(MapPinned),
                    headerTitle: "Landmarks",
                    tabBarLabel: "Landmarks"
                }}
            />
            <Tabs.Screen
                name='pasalubong-centers'
                options={{
                    tabBarIcon: TabIcon(MapPinHouse),
                    headerShown: false,
                    tabBarLabel: "Pasalubong Centers"
                }}
            />
            <Tabs.Screen
                name='more'
                options={{
                    tabBarIcon: TabIcon(Ellipsis),
                    headerShown: false,
                    tabBarLabel: "More"
                }}
            />

        </Tabs>
    )
}

export default AdminTabsLayout