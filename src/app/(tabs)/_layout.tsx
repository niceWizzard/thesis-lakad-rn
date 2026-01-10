import { Icon } from '@/components/ui/icon';
import { Tabs } from 'expo-router';
import { Car, Ellipsis, Navigation } from 'lucide-react-native';
import React from 'react';



export const primaryColor = "#7fcc20";


export function TabIcon(icon: React.ElementType<any, keyof React.JSX.IntrinsicElements>): ((props: {
    focused: boolean;
    color: string;
    size: number;
}) => React.ReactNode) | undefined {
    return ({ color, focused }) => < Icon as={icon} color={focused ? primaryColor : color} />
}

export default function TabLayout() {



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