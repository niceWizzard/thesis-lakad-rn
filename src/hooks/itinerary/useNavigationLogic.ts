import { useToastNotification } from '@/src/hooks/useToastNotification';
import { Landmark } from '@/src/model/landmark.types';
import { StopWithLandmark } from '@/src/model/stops.types';
import { getDistanceToSegment } from '@/src/utils/distance/getDistanceToSegment';
import { getHaversineDistance } from '@/src/utils/distance/getHaversineDistance';
import { formatDistance } from '@/src/utils/format/distance';
import { fetchDirections, MapboxRoute } from '@/src/utils/navigation/fetchDirections';
import { toggleStopStatus } from '@/src/utils/toggleStopStatus';
import { Camera } from '@rnmapbox/maps';
import { useQueryClient } from '@tanstack/react-query';
import { lineSlice, nearestPointOnLine, point, length as turfLength } from '@turf/turf';
import { useFocusEffect } from 'expo-router';
import * as Speech from 'expo-speech';
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
    isVoiceEnabled: boolean;
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
    isVoiceEnabled,
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
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [currentStepRemainingDistance, setCurrentStepRemainingDistance] = useState(0);

    useEffect(() => {
        setCurrentStepIndex(0);
        setCurrentStepRemainingDistance(0);
    }, [navigationRoute]);

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
            if (isVoiceEnabled) {
                Speech.speak("You have arrived at your destination.", { language: 'en' });
            }
        } catch (e: any) {
            showToast({
                title: "Error",
                description: e.message ?? "Some error happened while finishing navigation.",
                action: "error"
            });
        } finally {
            isProcessingArrival.current = false;
        }
    }, [refetchItinerary, showToast, switchMode, queryClient, isVoiceEnabled]);


    // -------------------------------------------------------------------------
    // 2. Continuous Monitoring (Arrival & Rerouting)
    // -------------------------------------------------------------------------
    useFocusEffect(
        useCallback(() => {
            if (mode !== Mode.Navigating || !nextUnvisitedStop || !userLocation) {
                return;
            }
            const currentLeg = navigationRoute[0].legs[0];

            // A. Check Arrival (Distance to destination < 10m)
            const distanceToDestination = getHaversineDistance(
                userLocation,
                [nextUnvisitedStop.landmark.longitude, nextUnvisitedStop.landmark.latitude]
            );

            if (distanceToDestination <= 20 || currentLeg.distance <= 10) {
                finishedNavigating(nextUnvisitedStop);
                return;
            }

            // B. Distance Calculation for Current Step
            if (navigationRoute.length && currentLeg) {
                const currentStep = currentLeg.steps[currentStepIndex];
                const calculatedDistance = calculateRemainingStepDistance(userLocation, currentStep);
                setCurrentStepRemainingDistance(calculatedDistance);
            }


            // C. Check Rerouting (Distance to next maneuver > 50m)
            if (navigationRoute.length && navigationRoute[0].legs.length) {
                if (currentStepIndex < currentLeg.steps.length) {
                    const nextStep = currentLeg.steps[currentStepIndex + 1];
                    // Only advance if we are really close to the start of the next step
                    if (nextStep) {
                        const distanceToNextStepStart = getHaversineDistance(
                            userLocation,
                            [nextStep.geometry.coordinates[0][0], nextStep.geometry.coordinates[0][1]]
                        );

                        // If we are close to the next step, advance
                        // Also check if we have "completed" the current step distance-wise
                        if (distanceToNextStepStart < 10) {
                            setCurrentStepIndex(currentStepIndex + 1);
                            return;
                        }
                    }
                }


                // Check distance to Route (if off-route, fetch mapbox api)
                const distanceToRoute = getHaversineDistance(
                    userLocation,
                    nearestPointOnLine(
                        navigationRoute[0].geometry,
                        userLocation
                    ).geometry.coordinates
                );
                if (distanceToRoute > 30) {
                    // Check if we have moved significantly since the last reroute
                    const distanceSinceLastReroute = lastRerouteLocation.current
                        ? getHaversineDistance(userLocation, lastRerouteLocation.current)
                        : 9999; // If null, treat as moved enough

                    if (distanceSinceLastReroute > 20) {
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
        }, [mode, nextUnvisitedStop, userLocation, navigationRoute, finishedNavigating, currentStepIndex, navigationProfile, avoidTolls, setNavigationRoute, showToast])
    );

    // -------------------------------------------------------------------------
    // 2.5 TTS Logic (Text-to-Speech)
    // -------------------------------------------------------------------------
    const lastSpokenInstruction = useRef<string | null>(null);

    useEffect(() => {
        if (mode === Mode.Navigating && isVoiceEnabled && navigationRoute.length > 0) {
            const currentLeg = navigationRoute[0].legs[0];
            const step = currentLeg?.steps[currentStepIndex];

            if (step && step.maneuver) {
                const instruction = step.maneuver.instruction;
                // Only speak if it's a new instruction
                if (instruction !== lastSpokenInstruction.current) {
                    const distanceToSpeak = calculateRemainingStepDistance(userLocation, step);
                    Speech.stop();
                    Speech.speak(`${instruction} for ${formatDistance(distanceToSpeak)}`, { language: 'en' });
                    lastSpokenInstruction.current = instruction;
                }
            }
        } else {
            // Reset if we exit navigation or voice is disabled, so if we re-enter it speaks again if needed
            if (mode !== Mode.Navigating) {
                lastSpokenInstruction.current = null;
            }
        }
    }, [currentStepIndex, mode, isVoiceEnabled, navigationRoute, userLocation]);


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

        if (!userLocation) {
            showToast({
                title: "Location not found",
                description: "Please enable location services and try again.",
                action: "error"
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
            const distToUser = getHaversineDistance(userLocation ?? [120.8092, 14.8605], poiCoords);
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


    // -------------------------------------------------------------------------
    // 5. Route Line Slicing (Visuals)
    // -------------------------------------------------------------------------
    const [routeLine, setRouteLine] = useState<any>(null);

    useEffect(() => {
        if (!navigationRoute.length) {
            setRouteLine(null);
            return;
        }

        const fullLine = navigationRoute[0].geometry;

        if (mode === Mode.Navigating && userLocation) {
            try {
                const userP = point(userLocation);
                const snapped = nearestPointOnLine(fullLine, userP);
                const lastCoord = fullLine.coordinates[fullLine.coordinates.length - 1];
                const endP = point(lastCoord);

                // lineSlice requires the start point to be on the line (nearestPointOnLine ensures this mostly, but snapping helps)
                // If the user is very far, nearestPointOnLine still finds the projection.
                const sliced = lineSlice(snapped, endP, fullLine);
                setRouteLine(sliced);
            } catch (e) {
                console.warn("Error slicing route line:", e);
                setRouteLine(fullLine);
            }
        } else {
            setRouteLine(fullLine);
        }
    }, [navigationRoute, userLocation, mode]);


    return {
        startNavigation: handleNavigationButtonClick,
        closePasalubongsInPath,
        isCalculatingRoute,
        isStartingNavigation,
        onArrive: () => finishedNavigating(nextUnvisitedStop!),
        currentStepIndex,
        currentStepRemainingDistance,
        routeLine,
    };
};

const calculateRemainingStepDistance = (userLocation: [number, number] | null, step: any) => {
    if (!userLocation || !step || !step.geometry) return step?.distance || 0;
    try {
        // Snap user location to the current step line
        const userPoint = point(userLocation);
        const line = step.geometry;
        const snappedPoint = nearestPointOnLine(line, userPoint);

        // Calculate distance from snapped point to the end of the line
        const endPoint = point(step.geometry.coordinates[step.geometry.coordinates.length - 1]);
        const slicedLine = lineSlice(snappedPoint, endPoint, line);
        const distanceInKm = turfLength(slicedLine, { units: 'kilometers' });

        return distanceInKm * 1000; // Convert to meters
    } catch (e) {
        // Fallback in case of turf errors (e.g. invalid geometry)
        console.warn("Error calculating step distance", e);
        return step.distance;
    }
};
