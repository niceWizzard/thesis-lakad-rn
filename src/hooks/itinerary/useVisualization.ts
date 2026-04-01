import { fetchDirections } from '@/src/utils/navigation/fetchDirections';
import { Camera } from '@rnmapbox/maps';
import { along, lineString, point, length as turfLength } from '@turf/turf';
import { useCallback, useEffect, useRef, useState } from 'react';

type Profile = 'driving' | 'walking' | 'cycling';

interface UseVisualizationProps {
    userLocation: [number, number] | null;
    pendingStops: { place: { longitude: number; latitude: number } }[];
    cameraRef: React.RefObject<Camera | null>;
}

export const useVisualization = ({ userLocation, pendingStops, cameraRef }: UseVisualizationProps) => {
    const [isVisualizing, setIsVisualizing] = useState(false);
    const [isFetchingRoute, setIsFetchingRoute] = useState(false);
    const [visualizationProfile, setVisualizationProfile] = useState<Profile>('driving');

    // GeoJSON references for rendering
    const [animatedRoute, setAnimatedRoute] = useState<GeoJSON.Feature<GeoJSON.LineString> | null>(null);
    const [animatedMarker, setAnimatedMarker] = useState<GeoJSON.Feature<GeoJSON.Point> | null>(null);

    const animFrameRef = useRef<number | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fullLegsRef = useRef<GeoJSON.Feature<GeoJSON.LineString>[]>([]);
    const drawnCoordinatesRef = useRef<number[][]>([]);
    const currentLegIndexRef = useRef(0);
    const distanceAlongRef = useRef<number>(0);
    const lastRouteUpdateRef = useRef<number>(0);

    const animateLeg = useCallback(() => {
        if (!fullLegsRef.current || currentLegIndexRef.current >= fullLegsRef.current.length) {
            return;
        }

        const currentLegLine = fullLegsRef.current[currentLegIndexRef.current];
        if (!currentLegLine || currentLegLine.geometry.coordinates.length < 2) {
            // Skip invalid leg
            currentLegIndexRef.current++;
            distanceAlongRef.current = 0;
            timeoutRef.current = setTimeout(animateLeg, 16);
            return;
        }

        const totalLengthKm = turfLength(currentLegLine, { units: 'kilometers' });

        // Emulate speed by drastically changing distance per frame instead of flooding timeouts
        let stepSizeKm = 0.1; // 100 meters per frame (5x faster target)
        if (visualizationProfile === 'cycling') stepSizeKm = 0.04; 
        if (visualizationProfile === 'walking') stepSizeKm = 0.01;
        
        distanceAlongRef.current += stepSizeKm;

        if (distanceAlongRef.current >= totalLengthKm) {
            // Leg finished
            const endCoord = currentLegLine.geometry.coordinates[currentLegLine.geometry.coordinates.length - 1];
            setAnimatedMarker(point(endCoord));

            // Cap the leg cleanly by pushing the destination node (prevent straight lines back to origin)
            drawnCoordinatesRef.current.push(endCoord);

            // Remove adjacent duplicates
            const uniqueDrawn = drawnCoordinatesRef.current.filter((c, i, arr) =>
                i === 0 || c[0] !== arr[i - 1][0] || c[1] !== arr[i - 1][1]
            );

            if (uniqueDrawn.length >= 2) {
                setAnimatedRoute(lineString(uniqueDrawn));
            }

            cameraRef.current?.setCamera({
                centerCoordinate: endCoord,
                animationDuration: 100,
            });

            currentLegIndexRef.current++;
            distanceAlongRef.current = 0;

            if (currentLegIndexRef.current < fullLegsRef.current.length) {
                // Pause for 500ms before next leg
                timeoutRef.current = setTimeout(animateLeg, 500);
            }
            return;
        }

        // Still progressing through current leg
        const currentPoint = along(currentLegLine, distanceAlongRef.current, { units: 'kilometers' });
        setAnimatedMarker(currentPoint);

        // Simply append the current coordinate instead of heavily recalculating lineSlice
        const coord = currentPoint.geometry.coordinates;
        const lastDrawn = drawnCoordinatesRef.current[drawnCoordinatesRef.current.length - 1];
        
        // Push only if significantly distinct to avoid coordinate pileup
        if (!lastDrawn || coord[0] !== lastDrawn[0] || coord[1] !== lastDrawn[1]) {
            drawnCoordinatesRef.current.push(coord);
        }

        // CRITICAL PERFORMANCE FIX: Only send the huge route geometry array across the bridge every ~64ms
        // Sending it every frame causes massive React side "considerable stalling"
        const now = Date.now();
        if (now - lastRouteUpdateRef.current > 64 && drawnCoordinatesRef.current.length >= 2) {
            setAnimatedRoute(lineString(drawnCoordinatesRef.current));
            lastRouteUpdateRef.current = now;
        }

        // Lock to 60 FPS (16ms) to stop the JS loop from choking
        const cooldown = 16;

        // Move camera smoothly matching the cooldown interval
        cameraRef.current?.setCamera({
            centerCoordinate: currentPoint.geometry.coordinates,
            animationDuration: cooldown + 10,
        });

        timeoutRef.current = setTimeout(animateLeg, cooldown);
    }, [cameraRef, visualizationProfile]);

    const startVisualization = useCallback(async (profile: Profile = visualizationProfile) => {
        if (!userLocation && pendingStops.length === 0) return;

        setIsVisualizing(true);
        setIsFetchingRoute(true);
        setVisualizationProfile(profile);
        setAnimatedRoute(null);
        setAnimatedMarker(null);

        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        try {
            const waypoints = [
                userLocation ?? [pendingStops[0].place.longitude, pendingStops[0].place.latitude],
                ...pendingStops.map((stop) => [stop.place.longitude, stop.place.latitude])
            ] as [number, number][];

            if (waypoints.length < 2) {
                setIsFetchingRoute(false);
                setIsVisualizing(false);
                return;
            }

            const data = await fetchDirections({
                waypoints,
                profile: profile,
                steps: true // ensuring we get leg steps
            });

            if (data.routes && data.routes.length > 0) {
                const route = data.routes[0];

                // Parse legs
                const validLegs = route.legs.map(leg => {
                    const coords: number[][] = [];
                    // Fallback to leg geometry if steps are missing, but mapbox returns steps true
                    if (leg.steps && leg.steps.length > 0) {
                        leg.steps.forEach(step => {
                            if (step.geometry && step.geometry.coordinates) {
                                coords.push(...step.geometry.coordinates);
                            }
                        });
                    }

                    const unique = coords.filter((c, i, arr) => i === 0 || c[0] !== arr[i - 1][0] || c[1] !== arr[i - 1][1]);
                    return unique.length >= 2 ? lineString(unique) : null;
                }).filter(l => l !== null) as GeoJSON.Feature<GeoJSON.LineString>[];

                if (validLegs.length === 0) {
                    setIsFetchingRoute(false);
                    return;
                }

                fullLegsRef.current = validLegs;
                drawnCoordinatesRef.current = [];
                currentLegIndexRef.current = 0;
                distanceAlongRef.current = 0;

                // Initialize the marker at the very first point of first leg
                const startCoord = validLegs[0].geometry.coordinates[0];
                setAnimatedMarker(point(startCoord));

                // Set the camera to the first position
                cameraRef.current?.setCamera({
                    centerCoordinate: startCoord,
                    zoomLevel: 14,
                    animationDuration: 500,
                });

                setIsFetchingRoute(false);

                // Wait 500ms before starting animation
                timeoutRef.current = setTimeout(animateLeg, 500);

            } else {
                setIsFetchingRoute(false);
                setIsVisualizing(false);
            }
        } catch (error) {
            console.error("Error fetching visualization route:", error);
            setIsFetchingRoute(false);
            setIsVisualizing(false);
        }
    }, [userLocation, pendingStops, cameraRef, visualizationProfile, animateLeg]);

    const stopVisualization = useCallback(() => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        animFrameRef.current = null;
        timeoutRef.current = null;
        setIsVisualizing(false);
        setAnimatedRoute(null);
        setAnimatedMarker(null);
        fullLegsRef.current = [];
    }, []);

    useEffect(() => {
        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    return {
        isVisualizing,
        isFetchingRoute,
        visualizationProfile,
        animatedRoute,
        animatedMarker,
        startVisualization,
        stopVisualization,
    };
};
