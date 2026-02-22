import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { withLayoutContext } from 'expo-router';
import { useColorScheme } from 'react-native';

import { primaryColorDark, primaryColorLight } from '@/src/app/(tabs)/_layout';

const { Navigator } = createMaterialTopTabNavigator();

export const MaterialTopTabs = withLayoutContext(Navigator);

const ArchivedPlacesLayout = () => {
    const colorScheme = useColorScheme();
    const primaryColor = colorScheme === 'dark' ? primaryColorDark : primaryColorLight;

    return (
        <MaterialTopTabs
            screenOptions={{
                tabBarActiveTintColor: primaryColor,
                tabBarIndicatorStyle: { backgroundColor: primaryColor },
                tabBarLabelStyle: { fontWeight: 'bold', textTransform: 'capitalize' },
            }}
        >
            <MaterialTopTabs.Screen name="index" options={{ title: "Landmarks" }} />
            <MaterialTopTabs.Screen name="pasalubongs" options={{ title: "Pasalubong Centers" }} />
        </MaterialTopTabs>
    );
};

export default ArchivedPlacesLayout;
