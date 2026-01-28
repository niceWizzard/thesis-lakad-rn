import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

/**
 * Hook to request permissions and track the user's current location.
 * 
 * It uses `Location.watchPositionAsync` for high-accuracy updates.
 * 
 * @returns The current user location as [longitude, latitude] or null if not yet determined.
 */
export const useUserLocation = () => {
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

    useEffect(() => {
        let subscription: Location.LocationSubscription | null = null;

        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            // Get initial position quickly
            const loc = await Location.getCurrentPositionAsync({});
            setUserLocation([loc.coords.longitude, loc.coords.latitude]);

            // Watch for updates
            subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.Highest,
                    timeInterval: 3000,
                    distanceInterval: 5, // update every 5 m
                },
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setUserLocation([longitude, latitude]);
                }
            );
        })();

        return () => {
            if (subscription) {
                subscription.remove();
            }
        };
    }, []);

    return userLocation;
};
