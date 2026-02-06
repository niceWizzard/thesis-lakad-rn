import { Icon } from '@/components/ui/icon';
import { Tabs } from 'expo-router';
import { Car, Ellipsis, Navigation } from 'lucide-react-native';
import React from 'react';
import { useColorScheme } from 'react-native';



export const primaryColorLight = "rgb(16,185,129)";
export const primaryColorDark = "rgb(52,211,153)";


export function TabIcon(icon: React.ElementType) {
    // Give the inner function a name
    const IconComponent = ({ color, focused }: { color: string; focused: boolean }) => (
        <Icon as={icon} color={color} />
    );

    // Set the display name explicitly
    IconComponent.displayName = 'TabIcon';

    return IconComponent;
}

export default function TabLayout() {

    const colorScheme = useColorScheme();
    const primaryColor = colorScheme === 'dark' ? primaryColorDark : primaryColorLight;

    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: primaryColor,
        }}>
            <Tabs.Screen
                name="index"
                options={{
                    tabBarIcon: TabIcon(Navigation),
                    tabBarLabel: 'Explore',
                    headerShown: false,
                }}
            />
            <Tabs.Screen
                name="itineraries"
                options={{
                    title: 'Itineraries',
                    tabBarIcon: TabIcon(Car),
                }}
            />
            <Tabs.Screen
                name="more"
                options={{
                    title: 'More',
                    headerShown: false,
                    tabBarIcon: TabIcon(Ellipsis),
                }}
            />
        </Tabs>
    );
}