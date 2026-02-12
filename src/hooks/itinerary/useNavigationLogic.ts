import { useToastNotification } from '@/src/hooks/useToastNotification';
import { Landmark } from '@/src/model/landmark.types';
import { StopWithLandmark } from '@/src/model/stops.types';
import { getDistanceToSegment } from '@/src/utils/distance/getDistanceToSegment';
import { getHaversineDistance } from '@/src/utils/distance/getHaversineDistance';
import { fetchDirections, MapboxRoute } from '@/src/utils/navigation/fetchDirections';
import { toggleStopStatus } from '@/src/utils/toggleStopStatus';
import { Camera } from '@rnmapbox/maps';
import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Mode } from './useNavigationState';

interface UseNavigationLogicProps {
    mode: Mode;
    userLocation: [number, number] | null;
    navigationRoute: MapboxRoute[];
    setNavigationRoute: (route: MapboxRoute[]) => void;
    switchMode: (mode: Mode) => void;
    nextUnvisitedStop: StopWithLandmark | null;
    refetchItinerary: () => Promise<any>;
    pasalubongs: Landmark[] | undefined;
    cameraRef: React.RefObject<Camera | null>;
    navigationProfile: 'driving' | 'walking' | 'cycling';
    avoidTolls: boolean;
}

/**
 * Hook to handle the core navigation logic:
 * - Starting navigation (calculating routes)
 * - Monitoring progress (arrival detection, rerouting)
 * - Identifying pasalubong centers along the path
 */
export const useNavigationLogic = ({
    mode,
    userLocation,
    navigationRoute,
    setNavigationRoute,
    switchMode,
    nextUnvisitedStop,
    refetchItinerary,
    pasalubongs,
    cameraRef,
    navigationProfile,
    avoidTolls,
}: UseNavigationLogicProps) => {

    const isProcessingArrival = useRef(false);
    const { showToast } = useToastNotification();
    const queryClient = useQueryClient();

    // Use ref to access latest location without triggering re-renders
    const userLocationRef = useRef(userLocation);
    // Track where we last rerouted to prevent infinite loops when stationary
    const lastRerouteLocation = useRef<[number, number] | null>(null);

    useEffect(() => {
        userLocationRef.current = userLocation;
    }, [userLocation]);

    // Loading states
    const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
    const [isStartingNavigation, setIsStartingNavigation] = useState(false);

    // -------------------------------------------------------------------------
    // 1. Logic for Completing Navigation (Arrival)
    // -------------------------------------------------------------------------
    const finishedNavigating = useCallback(async (visitedStop: StopWithLandmark) => {
        if (isProcessingArrival.current) return;
        isProcessingArrival.current = true;

        try {
            await toggleStopStatus(visitedStop);
            await refetchItinerary();
            queryClient.invalidateQueries({ queryKey: ['itineraries'] });
            switchMode(Mode.Viewing);
            showToast({
                title: "You have arrived!",
            });
        } catch (e: any) {
            showToast({
                title: "Error",
                description: e.message ?? "Some error happened while finishing navigation.",
                action: "error"
            });
        } finally {
            isProcessingArrival.current = false;
        }
    }, [refetchItinerary, showToast, switchMode, queryClient]);


    // -------------------------------------------------------------------------
    // 2. Continuous Monitoring (Arrival & Rerouting)
    // -------------------------------------------------------------------------
    useFocusEffect(
        useCallback(() => {
            if (mode !== Mode.Navigating || !nextUnvisitedStop || !userLocation) {
                return;
            }

            // A. Check Arrival (Distance to destination < 10m)
            const distanceToDestination = getHaversineDistance(
                userLocation,
                [nextUnvisitedStop.landmark.longitude, nextUnvisitedStop.landmark.latitude]
            );

            if (distanceToDestination <= 10) {
                finishedNavigating(nextUnvisitedStop);
                return;
            }

            // B. Check Rerouting (Distance to next maneuver > 50m)
            if (navigationRoute.length && navigationRoute[0].legs.length) {
                const currentLeg = navigationRoute[0].legs[0];
                const nextStep = currentLeg.steps[0];

                const distanceToNextStep = getHaversineDistance(
                    userLocation,
                    nextStep.maneuver.location
                );

                if (distanceToNextStep > 50) {
                    // Check if we have moved significantly since the last reroute
                    const distanceSinceLastReroute = lastRerouteLocation.current
                        ? getHaversineDistance(userLocation, lastRerouteLocation.current)
                        : 9999; // If null, treat as moved enough

                    if (distanceSinceLastReroute > 5) {
                        (async () => {
                            try {
                                lastRerouteLocation.current = userLocation; // Update last reroute location
                                setIsCalculatingRoute(true);
                                const data = await fetchDirections({
                                    waypoints: [
                                        userLocation,
                                        [nextUnvisitedStop.landmark.longitude, nextUnvisitedStop.landmark.latitude]
                                    ],
                                    profile: navigationProfile,
                                    exclude: (avoidTolls && navigationProfile === 'driving') ? ['toll'] : [],
                                });
                                setNavigationRoute(data.routes);
                            } catch (error) {
                                console.log("Error rerouting:", error);
                                showToast({
                                    title: "Error",
                                    description: (error as any).message ?? "Some error happened while rerouting.",
                                    action: "error"
                                });
                            } finally {
                                setIsCalculatingRoute(false);
                            }
                        })();
                    }
                }
            }
        }, [mode, nextUnvisitedStop, userLocation, navigationRoute, finishedNavigating, navigationProfile, avoidTolls, setNavigationRoute, showToast])
    );


    // -------------------------------------------------------------------------
    // 3. Reroute on Settings Change
    // -------------------------------------------------------------------------
    useFocusEffect(
        useCallback(() => {
            if (mode !== Mode.Navigating || !nextUnvisitedStop) return;

            const currentLocation = userLocationRef.current;
            if (!currentLocation) return;

            // Trigger immediately when these change
            (async () => {
                try {
                    setIsCalculatingRoute(true);
                    lastRerouteLocation.current = currentLocation; // Reset anchor to avoid immediate double triggers
                    const data = await fetchDirections({
                        waypoints: [
                            currentLocation,
                            [nextUnvisitedStop.landmark.longitude, nextUnvisitedStop.landmark.latitude]
                        ],
                        profile: navigationProfile,
                        exclude: (avoidTolls && navigationProfile === 'driving') ? ['toll'] : [],
                    });
                    setNavigationRoute(data.routes);
                } catch (error) {
                    console.log("Error updating route settings:", error);
                } finally {
                    setIsCalculatingRoute(false);
                }
            })();
        }, [navigationProfile, avoidTolls, mode, nextUnvisitedStop, setNavigationRoute, setIsCalculatingRoute])
    );


    // -------------------------------------------------------------------------
    // 4. Start Navigation Action
    // -------------------------------------------------------------------------
    const handleNavigationButtonClick = async () => {
        if (!nextUnvisitedStop) {
            showToast({
                title: "No stops left",
                description: "You have completed all points in this itinerary.",
                action: "info"
            });
            return;
        }

        const startLocation = userLocation || [120.8092, 14.8605];

        try {
            setIsStartingNavigation(true);
            setIsCalculatingRoute(true);
            // Initialize/Result last reroute location so we don't immediately trigger a reroute if snapped
            lastRerouteLocation.current = startLocation;

            const data = await fetchDirections({
                waypoints: [
                    startLocation,
                    [nextUnvisitedStop.landmark.longitude, nextUnvisitedStop.landmark.latitude]
                ],
                profile: navigationProfile,
                exclude: getExclude(),
            });

            setNavigationRoute(data.routes);
            setIsCalculatingRoute(false);

            switchMode(Mode.Navigating);

            // Animate Camera
            cameraRef.current?.setCamera({
                centerCoordinate: startLocation,
                zoomLevel: 18,
                pitch: 55, // 3D perspective
                heading: data.routes[0].legs[0].steps[0].maneuver.bearing_after,
                animationDuration: 1500,
            });

            // Keep loading overlay for smooth transition
            setTimeout(() => {
                setIsStartingNavigation(false);
            }, 150);

        } catch (error: any) {
            setIsCalculatingRoute(false);
            setIsStartingNavigation(false);
            showToast({
                title: "Error starting navigation",
                description: error.message,
                action: "error"
            });
        }
    };

    // -------------------------------------------------------------------------
    // 4. Pasalubong Centers along the path
    // -------------------------------------------------------------------------
    const closePasalubongsInPath = useMemo(() => {
        if (mode !== Mode.Navigating || !navigationRoute.length || !pasalubongs) {
            return [];
        }
        const pathCoordinates = navigationRoute[0].geometry.coordinates;

        return pasalubongs.filter((poi) => {
            const poiCoords: [number, number] = [poi.longitude, poi.latitude];

            // Quick check: Is the POI within 100m of the USER currently?
            const distToUser = getHaversineDistance(userLocation!, poiCoords);
            if (distToUser <= 100) return true;

            // Deep check: Is the POI within 100m of ANY segment of the path?
            for (let i = 0; i < pathCoordinates.length - 1; i++) {
                const start = pathCoordinates[i] as [number, number];
                const end = pathCoordinates[i + 1] as [number, number];

                const distanceToSegment = getDistanceToSegment(poiCoords, start, end);
                if (distanceToSegment <= 100) { // 100 meters
                    return true;
                }
            }
            return false;
        });
    }, [mode, navigationRoute, pasalubongs, userLocation]);


    const getExclude = () => {
        const exclude: string[] = [];
        if (navigationProfile === 'driving') {
            if (avoidTolls) exclude.push('toll');
        }
        return exclude;
    };


    return {
        startNavigation: handleNavigationButtonClick,
        closePasalubongsInPath,
        isCalculatingRoute,
        isStartingNavigation
    };
};
