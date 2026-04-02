import { useCallback, useState } from 'react';
import { fetchDirections, MapboxRoute } from '@/src/utils/navigation/fetchDirections';
import { getHaversineDistance } from '@/src/utils/distance/getHaversineDistance';
import { StopWithPlace } from '@/src/model/stops.types';
import { useToastNotification } from '@/src/hooks/useToastNotification';
import { Mode } from './useNavigationState';

const MAX_USER_DISTANCE_KM = 100; // 100km fallback

export const useVisualizationLogic = (
    mode: Mode,
    switchMode: (newMode: Mode) => void,
    userLocation: [number, number] | null,
    pendingStops: StopWithPlace[] // Should be sorted already
) => {
    const { showToast } = useToastNotification();

    const [isVisualizing, setIsVisualizing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Store full route and waypoints
    const [visualizationRoute, setVisualizationRoute] = useState<MapboxRoute | null>(null);
    const [visualizationNames, setVisualizationNames] = useState<string[]>([]); // To track names of each waypoint
    const [visualizationStopIds, setVisualizationStopIds] = useState<(string | number | null)[]>([]); // To track stop IDs
    
    // Core state
    const [currentVisualizationLegIndex, setCurrentVisualizationLegIndex] = useState(0);
    const [visualizationProfile, setVisualizationProfile] = useState<'driving' | 'walking' | 'cycling'>('driving');
    const [staticUserLocation, setStaticUserLocation] = useState<[number, number] | null>(null);

    const startVisualization = useCallback(async () => {
        if (pendingStops.length < 1) {
             showToast({ title: "No unvisited stops", action: "info" });
             return;
        }

        setIsLoading(true);
        // Take a static snapshot
        setStaticUserLocation(userLocation);

        const stopsCoords: [number, number][] = pendingStops.map(s => [s.place.longitude, s.place.latitude]);
        const names: string[] = pendingStops.map(s => s.place.name);

        let waypoints: [number, number][] = [];
        let finalNames: string[] = [];
        let finalStopIds: (string | number | null)[] = [];

        if (userLocation) {
            const distanceKM = getHaversineDistance(userLocation, stopsCoords[0]) / 1000;
            if (distanceKM > MAX_USER_DISTANCE_KM) {
                waypoints = [...stopsCoords];
                finalNames = [...names];
                finalStopIds = pendingStops.map(s => s.id);
            } else {
                waypoints = [userLocation, ...stopsCoords];
                finalNames = ["Your Location", ...names];
                finalStopIds = [null, ...pendingStops.map(s => s.id)];
            }
        } else {
            waypoints = [...stopsCoords];
            finalNames = [...names];
            finalStopIds = pendingStops.map(s => s.id);
        }

        // Just in case it's 1 point (doesn't make sense for MapBox Directions)
        if (waypoints.length < 2) {
             showToast({ title: "Not enough points to visualize route", action: "info" });
             setIsLoading(false);
             return;
        }

        try {
            const data = await fetchDirections({
                waypoints,
                profile: visualizationProfile,
                exclude: [] // We can keep empty unless tolls matter
            });
            
            if (data.routes && data.routes.length > 0) {
                setVisualizationRoute(data.routes[0]);
                setVisualizationNames(finalNames);
                setVisualizationStopIds(finalStopIds);
                setCurrentVisualizationLegIndex(0);
                setIsVisualizing(true);
                switchMode(Mode.Visualizing);
            } else {
                throw new Error("No routes found.");
            }
        } catch (error: any) {
            showToast({
                title: "Error starting visualization",
                description: error.message,
                action: "error"
            });
        } finally {
            setIsLoading(false);
        }
    }, [pendingStops, userLocation, visualizationProfile, showToast, switchMode]);

    const reFetchProfile = useCallback(async (newProfile: 'driving' | 'walking' | 'cycling') => {
        if (!isVisualizing || pendingStops.length < 1) return;
        
        setIsLoading(true);
        setVisualizationProfile(newProfile);
        
        const stopsCoords: [number, number][] = pendingStops.map(s => [s.place.longitude, s.place.latitude]);
        const names: string[] = pendingStops.map(s => s.place.name);

        let waypoints: [number, number][] = [];
        let finalNames: string[] = [];
        let finalStopIds: (string | number | null)[] = [];

        if (staticUserLocation) {
            const distanceKM = getHaversineDistance(staticUserLocation, stopsCoords[0]) / 1000;
            if (distanceKM > MAX_USER_DISTANCE_KM) {
                waypoints = [...stopsCoords];
                finalNames = [...names];
                finalStopIds = pendingStops.map(s => s.id);
            } else {
                waypoints = [staticUserLocation, ...stopsCoords];
                finalNames = ["Your Location", ...names];
                finalStopIds = [null, ...pendingStops.map(s => s.id)];
            }
        } else {
            waypoints = [...stopsCoords];
            finalNames = [...names];
            finalStopIds = pendingStops.map(s => s.id);
        }

        try {
            const data = await fetchDirections({
                waypoints,
                profile: newProfile,
                exclude: []
            });
            
            if (data.routes && data.routes.length > 0) {
                setVisualizationRoute(data.routes[0]);
                setVisualizationNames(finalNames);
                setVisualizationStopIds(finalStopIds);
                // Keep the current leg index if possible, otherwise reset
                if (currentVisualizationLegIndex >= data.routes[0].legs.length) {
                     setCurrentVisualizationLegIndex(0);
                }
            } else {
                throw new Error("No routes found.");
            }
        } catch (error: any) {
            showToast({
                title: "Error fetching profile",
                description: error.message,
                action: "error"
            });
            // Revert profile on fail
        } finally {
            setIsLoading(false);
        }
    }, [isVisualizing, pendingStops, staticUserLocation, currentVisualizationLegIndex, showToast]);

    const changeProfile = (p: 'driving' | 'walking' | 'cycling') => {
        if (p === visualizationProfile) return;
        reFetchProfile(p);
    };

    const cancelVisualization = useCallback(() => {
        setIsVisualizing(false);
        setVisualizationRoute(null);
        setVisualizationNames([]);
        setVisualizationStopIds([]);
        setCurrentVisualizationLegIndex(0);
        switchMode(Mode.Viewing);
    }, [switchMode]);

    const nextLeg = () => {
        if (visualizationRoute && currentVisualizationLegIndex < visualizationRoute.legs.length - 1) {
            setCurrentVisualizationLegIndex(prev => prev + 1);
        }
    };

    const previousLeg = () => {
        if (currentVisualizationLegIndex > 0) {
            setCurrentVisualizationLegIndex(prev => prev - 1);
        }
    };

    const currentLeg = visualizationRoute ? visualizationRoute.legs[currentVisualizationLegIndex] : null;
    const currentLegGeometry = currentLeg ? {
        type: "LineString" as const,
        coordinates: currentLeg.steps.map(step => step.geometry.coordinates).flat()
    } as GeoJSON.LineString : null;

    const currentLegDuration = currentLeg ? currentLeg.duration : 0;
    const currentLegDistance = currentLeg ? currentLeg.distance : 0;
    
    const currentLegStartName = visualizationNames[currentVisualizationLegIndex] || "Unknown";
    const currentLegEndName = visualizationNames[currentVisualizationLegIndex + 1] || "Unknown";
    const currentLegStopIds = [
        visualizationStopIds[currentVisualizationLegIndex],
        visualizationStopIds[currentVisualizationLegIndex + 1]
    ].filter(id => id !== null && id !== undefined) as (string | number)[];

    const totalLegs = visualizationRoute ? visualizationRoute.legs.length : 0;

    return {
        isLoading,
        isVisualizing,
        startVisualization,
        cancelVisualization,
        currentVisualizationLegIndex,
        totalLegs,
        nextLeg,
        previousLeg,
        visualizationProfile,
        changeProfile,
        currentLegGeometry,
        currentLegDuration,
        currentLegDistance,
        currentLegStartName,
        currentLegEndName,
        currentLegStopIds
    };
};
