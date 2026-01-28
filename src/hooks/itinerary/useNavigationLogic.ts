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
import { useCallback, useMemo, useRef, useState } from 'react';
import { Mode } from './useNavigationState';

interface UseNavigationLogicProps { // Renamed from Props to avoid naming conflicts if necessary, but internal interface is fine
    mode: Mode;
    userLocation: [number, number] | null;
    navigationRoute: MapboxRoute[];
    setNavigationRoute: (route: MapboxRoute[]) => void;
    switchMode: (mode: Mode) => void;
    nextUnvisitedStop: StopWithLandmark | null;
    refetchItinerary: () => Promise<any>;
    commercials: Landmark[] | undefined;
    cameraRef: React.RefObject<Camera | null>;
}

/**
 * Hook to handle the core navigation logic:
 * - Starting navigation (calculating routes)
 * - Monitoring progress (arrival detection, rerouting)
 * - Identifying commercial landmarks along the path
 */
export const useNavigationLogic = ({
    mode,
    userLocation,
    navigationRoute,
    setNavigationRoute,
    switchMode,
    nextUnvisitedStop,
    refetchItinerary,
    commercials,
    cameraRef,
}: UseNavigationLogicProps) => {

    const isProcessingArrival = useRef(false);
    const { showToast } = useToastNotification();
    const queryClient = useQueryClient();

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
                console.log("Arrived at destination!");
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
                    (async () => {
                        try {
                            setIsCalculatingRoute(true);
                            const data = await fetchDirections({
                                waypoints: [
                                    userLocation,
                                    [nextUnvisitedStop.landmark.longitude, nextUnvisitedStop.landmark.latitude]
                                ],
                            });
                            setNavigationRoute(data.routes);
                        } catch (error) {
                            console.log("Error rerouting:", error);
                        } finally {
                            setIsCalculatingRoute(false);
                        }
                    })();
                }
            }
        }, [mode, nextUnvisitedStop, navigationRoute, userLocation, finishedNavigating])
    );


    // -------------------------------------------------------------------------
    // 3. Start Navigation Action
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

            const data = await fetchDirections({
                waypoints: [
                    startLocation,
                    [nextUnvisitedStop.landmark.longitude, nextUnvisitedStop.landmark.latitude]
                ],
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
            }, 1500);

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
    // 4. Commercials (POIs) along the path
    // -------------------------------------------------------------------------
    const closeCommercialsInPath = useMemo(() => {
        if (mode !== Mode.Navigating || !navigationRoute.length || !commercials) {
            return [];
        }
        const pathCoordinates = navigationRoute[0].geometry.coordinates;

        return commercials.filter((poi) => {
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
    }, [mode, navigationRoute, commercials, userLocation]);


    return {
        startNavigation: handleNavigationButtonClick,
        closeCommercialsInPath,
        isCalculatingRoute,
        isStartingNavigation
    };
};
