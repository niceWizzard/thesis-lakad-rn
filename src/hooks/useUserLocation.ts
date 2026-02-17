import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

/**
 * Hook to request permissions and track the user's current location and heading.
 *
 * It uses `Location.watchPositionAsync` for high-accuracy updates and
 * `Location.watchHeadingAsync` for compass heading.
 *
 * @returns An object containing the current user location as [longitude, latitude] and heading in degrees, or null if not yet determined.
 */
export const useUserLocation = () => {
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [heading, setHeading] = useState<number | null>(null);

    useEffect(() => {
        let locationSubscription: Location.LocationSubscription | null = null;
        let headingSubscription: Location.LocationSubscription | null = null;

        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            // Get initial position quickly
            const loc = await Location.getCurrentPositionAsync({});
            setUserLocation([loc.coords.longitude, loc.coords.latitude]);

            // Watch for location updates
            locationSubscription = await Location.watchPositionAsync(
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

            // Watch for heading updates
            headingSubscription = await Location.watchHeadingAsync((obj) => {
                const newHeading = obj.trueHeading;
                setHeading(prev => {
                    if (prev === null) return newHeading;

                    // Simple low-pass filter
                    // Calculate shortest difference
                    let diff = newHeading - prev;
                    if (diff > 180) diff -= 360;
                    if (diff < -180) diff += 360;

                    // If change is very small, ignore it to reduce micro-jitter? 
                    // Or just smooth it. User said "less sensitive", so filtering is good.
                    // Alpha of 0.1 means it takes ~20 updates to follow a step change fully, very smooth.
                    // Alpha of 0.2 is more responsive.
                    // Let's try 0.1 for "less sensitive".
                    const alpha = 0.1;
                    let next = prev + diff * alpha;

                    // Normalize
                    if (next >= 360) next -= 360;
                    if (next < 0) next += 360;

                    return next;
                });
            });
        })();

        return () => {
            if (locationSubscription) {
                locationSubscription.remove();
            }
            if (headingSubscription) {
                headingSubscription.remove();
            }
        };
    }, []);

    return { userLocation, heading };
};
