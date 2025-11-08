import { Icon } from '@/components/ui/icon';
import { Tabs } from 'expo-router';
import { Car, Ellipsis, Navigation } from 'lucide-react-native';
import React from 'react';

export default function TabLayout() {

  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => < Icon as={Navigation} color={color} />,
          tabBarLabel: 'Explore',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="itineraries"
        options={{
          title: 'Itineraries',
          tabBarIcon: ({ color }) => <Icon as={Car} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          headerShown: false,
          tabBarIcon: ({ color }) => <Icon as={Ellipsis} color={color} />,
        }}
      />
    </Tabs>
  );
}
