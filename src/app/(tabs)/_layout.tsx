import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import React from 'react';

import { useClientOnlyValue } from '@/src/components/useClientOnlyValue';
import { useColorScheme } from '@/src/components/useColorScheme';
import Colors from '@/src/constants/Colors';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={18} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => <TabBarIcon name="location-arrow" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="itineraries"
        options={{
          title: 'Itineraries',
          tabBarIcon: ({ color }) => <TabBarIcon name="car" color={color} />,
        }}
      />
    <Tabs.Screen
        name="more"
        options={{
            title: 'More',
            tabBarIcon: ({ color }) => <TabBarIcon name="ellipsis-v" color={color} />,
        }}
    />
    </Tabs>
  );
}
