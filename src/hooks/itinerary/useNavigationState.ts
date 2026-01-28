import { MapboxRoute } from '@/src/utils/navigation/fetchDirections';
import BottomSheet from '@gorhom/bottom-sheet';
import { Camera } from '@rnmapbox/maps';
import { useCallback, useEffect, useRef, useState } from 'react';

export enum Mode {
    Viewing,
    Navigating,
}

/**
 * Hook to manage the UI state for navigation, including the mode (Viewing/Navigating),
 * bottom sheet visibility, and the map camera reference.
 * 
 * @param userLocation - Current user location to center camera on viewing mode switch.
 * @returns State and setters for navigation mode.
 */
export const useNavigationState = (userLocation: [number, number] | null) => {
    const [mode, setMode] = useState<Mode>(Mode.Viewing);
    const [isSheetOpen, setIsSheetOpen] = useState(true);
    const [navigationRoute, setNavigationRoute] = useState<MapboxRoute[]>([]);

    const cameraRef = useRef<Camera>(null);
    const bottomSheetRef = useRef<BottomSheet>(null);

    // Sync BottomSheet with state
    useEffect(() => {
        if (isSheetOpen) {
            requestAnimationFrame(() => {
                bottomSheetRef.current?.snapToIndex(0);
            });
        } else {
            bottomSheetRef.current?.close();
        }
    }, [isSheetOpen]);

    const switchMode = useCallback((newMode: Mode) => {
        switch (newMode) {
            case Mode.Viewing:
                setIsSheetOpen(true);
                setNavigationRoute([]);
                setMode(Mode.Viewing);
                cameraRef.current?.setCamera({
                    centerCoordinate: userLocation ?? [120.8092, 14.8605],
                    zoomLevel: 14,
                    animationDuration: 400,
                    pitch: 0,
                    heading: 0
                });
                return;
            case Mode.Navigating:
                setMode(Mode.Navigating);
                setIsSheetOpen(true);
                return;
            default:
                return;
        }
    }, [userLocation]);

    const locatePOI = (longitude: number, latitude: number) => {
        cameraRef.current?.setCamera({
            centerCoordinate: [longitude, latitude],
            zoomLevel: 18,
            animationDuration: 800,
            padding: { paddingBottom: 0, paddingTop: 40, paddingLeft: 20, paddingRight: 20 }
            // Note: Padding might need adjustment based on screen size, kept simpler for now
        });
    };

    return {
        mode,
        setMode,
        isSheetOpen,
        setIsSheetOpen,
        navigationRoute,
        setNavigationRoute,
        cameraRef,
        bottomSheetRef,
        switchMode,
        locatePOI
    };
};
