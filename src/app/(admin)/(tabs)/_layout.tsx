import { Tabs } from 'expo-router'
import { Ellipsis, MapPinned, Navigation } from 'lucide-react-native'
import React from 'react'
import { primaryColor, TabIcon } from '../../(tabs)/_layout'

const AdminTabsLayout = () => {
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