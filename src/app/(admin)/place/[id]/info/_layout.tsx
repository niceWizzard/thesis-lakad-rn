import { primaryColorDark, primaryColorLight } from '@/src/app/(tabs)/_layout';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { withLayoutContext } from 'expo-router';
import React from 'react'; // React import is needed
import { useColorScheme } from 'react-native';

const { Navigator } = createMaterialTopTabNavigator();

export const MaterialTopTabs = withLayoutContext(Navigator);

const LandmarkDetailLayout = () => {
    const colorScheme = useColorScheme();
    const primaryColor = colorScheme === 'dark' ? primaryColorDark : primaryColorLight;

    return (
        <MaterialTopTabs
            screenOptions={{
                tabBarActiveTintColor: primaryColor,
                tabBarInactiveTintColor: '#6b7280',
                tabBarIndicatorStyle: { backgroundColor: primaryColor, height: 3, borderRadius: 3 },
                tabBarLabelStyle: { fontWeight: 'bold', textTransform: 'none', fontSize: 13 },
                tabBarStyle: {
                    backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#ffffff',
                    elevation: 0,
                    shadowOpacity: 0,
                    borderBottomWidth: 1,
                    borderBottomColor: colorScheme === 'dark' ? '#333333' : '#e5e7eb',
                },
                tabBarPressColor: primaryColor + '20',
            }}
        >
            <MaterialTopTabs.Screen
                name="details"
                options={{ title: "Information" }}
            />
            <MaterialTopTabs.Screen
                name="analytics"
                options={{ title: "Analytics" }}
            />
        </MaterialTopTabs>
    );
};

export default LandmarkDetailLayout;
