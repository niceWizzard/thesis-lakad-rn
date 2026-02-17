import { Tabs } from 'expo-router'
import { Ellipsis, MapPinned, Navigation } from 'lucide-react-native'
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
                name='places'
                options={{
                    tabBarIcon: TabIcon(MapPinned),
                    tabBarLabel: "Places",
                    headerTitle: "Manage Places"
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