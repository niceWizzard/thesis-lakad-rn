import { useCallback, useMemo, useReducer } from 'react';
import { fetchDirections, MapboxRoute } from '@/src/utils/navigation/fetchDirections';
import { getHaversineDistance } from '@/src/utils/distance/getHaversineDistance';
import { StopWithPlace } from '@/src/model/stops.types';
import { useToastNotification } from '@/src/hooks/useToastNotification';
import { Mode } from './useNavigationState';

const MAX_USER_DISTANCE_KM = 100; // 100km fallback

type VisualizationProfile = 'driving' | 'walking' | 'cycling';

interface VisualizationState {
    isVisualizing: boolean;
    isLoading: boolean;
    route: MapboxRoute | null;
    names: string[];
    stopIds: (string | number | null)[];
    legIndex: number;
    profile: VisualizationProfile;
    staticUserLocation: [number, number] | null;
}

const initialState: VisualizationState = {
    isVisualizing: false,
    isLoading: false,
    route: null,
    names: [],
    stopIds: [],
    legIndex: 0,
    profile: 'driving',
    staticUserLocation: null,
};

type Action = 
    | { type: 'START_LOADING', payload?: { staticUserLocation?: [number, number] | null, profile?: VisualizationProfile } }
    | { type: 'SET_ROUTE_DATA', payload: { route: MapboxRoute, names: string[], stopIds: (string | number | null)[], keepLegIndex?: boolean } }
    | { type: 'ERROR' }
    | { type: 'NEXT_LEG' }
    | { type: 'PREVIOUS_LEG' }
    | { type: 'CANCEL' };

function visualizationReducer(state: VisualizationState, action: Action): VisualizationState {
    switch (action.type) {
        case 'START_LOADING':
            return { 
                ...state, 
                isLoading: true, 
                ...(action.payload?.staticUserLocation !== undefined && { staticUserLocation: action.payload.staticUserLocation }),
                ...(action.payload?.profile && { profile: action.payload.profile })
            };
        case 'SET_ROUTE_DATA': {
            const keepIndex = action.payload.keepLegIndex && state.legIndex < action.payload.route.legs.length ? state.legIndex : 0;
            return {
                ...state,
                isLoading: false,
                isVisualizing: true,
                route: action.payload.route,
                names: action.payload.names,
                stopIds: action.payload.stopIds,
                legIndex: keepIndex
            };
        }
        case 'ERROR':
            return {
                ...state,
                isLoading: false,
            };
        case 'NEXT_LEG':
            if (state.route && state.legIndex < state.route.legs.length - 1) {
                return { ...state, legIndex: state.legIndex + 1 };
            }
            return state;
        case 'PREVIOUS_LEG':
            if (state.legIndex > 0) {
                return { ...state, legIndex: state.legIndex - 1 };
            }
            return state;
        case 'CANCEL':
            return {
                ...initialState,
                profile: state.profile // Preserve profile preferences
            };
        default:
            return state;
    }
}

export const useVisualizationLogic = (
    mode: Mode,
    switchMode: (newMode: Mode) => void,
    userLocation: [number, number] | null,
    pendingStops: StopWithPlace[] // Should be sorted already
) => {
    const { showToast } = useToastNotification();
    const [state, dispatch] = useReducer(visualizationReducer, initialState);

    const getWaypointsAndMetadata = useCallback((locationToUse: [number, number] | null) => {
        const stopsCoords: [number, number][] = pendingStops.map(s => [s.place.longitude, s.place.latitude]);
        const names: string[] = pendingStops.map(s => s.place.name);

        let waypoints: [number, number][] = [...stopsCoords];
        let finalNames: string[] = [...names];
        let finalStopIds: (string | number | null)[] = pendingStops.map(s => s.id);

        if (locationToUse && stopsCoords.length > 0) {
            const distanceKM = getHaversineDistance(locationToUse, stopsCoords[0]) / 1000;
            if (distanceKM <= MAX_USER_DISTANCE_KM) {
                waypoints = [locationToUse, ...stopsCoords];
                finalNames = ["Your Location", ...names];
                finalStopIds = [null, ...finalStopIds];
            }
        }
        return { waypoints, finalNames, finalStopIds };
    }, [pendingStops]);

    const startVisualization = useCallback(async () => {
        if (pendingStops.length < 1) {
             showToast({ title: "No unvisited stops", action: "info" });
             return;
        }

        dispatch({ type: 'START_LOADING', payload: { staticUserLocation: userLocation } });

        const { waypoints, finalNames, finalStopIds } = getWaypointsAndMetadata(userLocation);

        if (waypoints.length < 2) {
             showToast({ title: "Not enough points to visualize route", action: "info" });
             dispatch({ type: 'ERROR' });
             return;
        }

        try {
            const data = await fetchDirections({ waypoints, profile: state.profile, exclude: [] });
            
            if (data.routes && data.routes.length > 0) {
                dispatch({ 
                    type: 'SET_ROUTE_DATA', 
                    payload: { route: data.routes[0], names: finalNames, stopIds: finalStopIds }
                });
                switchMode(Mode.Visualizing);
            } else {
                throw new Error("No routes found.");
            }
        } catch (error: any) {
            showToast({ title: "Error starting visualization", description: error.message, action: "error" });
            dispatch({ type: 'ERROR' });
        }
    }, [pendingStops, userLocation, state.profile, getWaypointsAndMetadata, showToast, switchMode]);

    const reFetchProfile = useCallback(async (newProfile: VisualizationProfile) => {
        if (!state.isVisualizing || pendingStops.length < 1) return;
        
        dispatch({ type: 'START_LOADING', payload: { profile: newProfile } });
        
        const { waypoints, finalNames, finalStopIds } = getWaypointsAndMetadata(state.staticUserLocation);

        try {
            const data = await fetchDirections({ waypoints, profile: newProfile, exclude: [] });
            
            if (data.routes && data.routes.length > 0) {
                dispatch({ 
                    type: 'SET_ROUTE_DATA', 
                    payload: { route: data.routes[0], names: finalNames, stopIds: finalStopIds, keepLegIndex: true }
                });
            } else {
                throw new Error("No routes found.");
            }
        } catch (error: any) {
            showToast({ title: "Error fetching profile", description: error.message, action: "error" });
            dispatch({ type: 'ERROR' });
        }
    }, [state.isVisualizing, pendingStops, state.staticUserLocation, getWaypointsAndMetadata, showToast]);

    const changeProfile = (p: VisualizationProfile) => {
        if (p === state.profile) return;
        reFetchProfile(p);
    };

    const cancelVisualization = useCallback(() => {
        dispatch({ type: 'CANCEL' });
        switchMode(Mode.Viewing);
    }, [switchMode]);

    const nextLeg = () => dispatch({ type: 'NEXT_LEG' });
    const previousLeg = () => dispatch({ type: 'PREVIOUS_LEG' });

    const currentLeg = state.route ? state.route.legs[state.legIndex] : null;

    const currentLegGeometry = useMemo(() => {
        return currentLeg ? {
            type: "LineString" as const,
            coordinates: currentLeg.steps.map(step => step.geometry.coordinates).flat()
        } as GeoJSON.LineString : null;
    }, [currentLeg]);

    const currentLegDuration = currentLeg ? currentLeg.duration : 0;
    const currentLegDistance = currentLeg ? currentLeg.distance : 0;
    
    const currentLegStartName = state.names[state.legIndex] || "Unknown";
    const currentLegEndName = state.names[state.legIndex + 1] || "Unknown";
    
    const currentLegStopIds = useMemo(() => {
        return [
            state.stopIds[state.legIndex],
            state.stopIds[state.legIndex + 1]
        ].filter(id => id !== null && id !== undefined) as (string | number)[];
    }, [state.stopIds, state.legIndex]);

    return {
        isLoading: state.isLoading,
        isVisualizing: state.isVisualizing,
        startVisualization,
        cancelVisualization,
        currentVisualizationLegIndex: state.legIndex,
        totalLegs: state.route ? state.route.legs.length : 0,
        nextLeg,
        previousLeg,
        visualizationProfile: state.profile,
        changeProfile,
        currentLegGeometry,
        currentLegDuration,
        currentLegDistance,
        currentLegStartName,
        currentLegEndName,
        currentLegStopIds
    };
};
