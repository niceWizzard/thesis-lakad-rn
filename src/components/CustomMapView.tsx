import { Camera, LocationPuck, MapView } from '@rnmapbox/maps';
import React, { ComponentProps } from 'react';

import { Box } from '@/components/ui/box';



const DEFAULT_COORDS: [number, number] = [120.8092, 14.8605];

// Map Pin Logic
const PINS = {
    HistoryPin: require("@/assets/images/categories/history.png"),
    LandscapePin: require("@/assets/images/categories/landscape.png"),
    NaturePin: require("@/assets/images/categories/nature.png"),
    ReligiousPin: require("@/assets/images/categories/religious.png"),
    WaterPin: require("@/assets/images/categories/water.png"),
    IconImage: require("@/assets/images/red_marker.png"),
};

interface LandmarkMapViewProps {
    cameraRef: React.RefObject<Camera | null>;
    sheetContent?: React.ReactNode;
    children?: React.ReactNode;
    overlays?: React.ReactNode;
    isSheetOpen: boolean;
    onSheetClose: () => void;
    mapViewProps?: ComponentProps<typeof MapView>
}

const CustomMapView = ({
    cameraRef,
    children,        // Content INSIDE the MapView (Markers, Shapes)
    overlays,        // Content OUTSIDE the MapView (FABs, Search)
    sheetContent,    // Content inside the Sheet
    isSheetOpen,
    onSheetClose,
    mapViewProps,
}: LandmarkMapViewProps) => {
    return (
        <Box className="flex-1 bg-background-0">
            <MapView
                style={{ flex: 1 }}
                {...mapViewProps}
            >
                <Camera ref={cameraRef} defaultSettings={{ centerCoordinate: DEFAULT_COORDS, zoomLevel: 12 }} />
                <LocationPuck pulsing={{ isEnabled: true }} />
                {children}
            </MapView>

            {/* UI Overlays */}
            {overlays}


        </Box>
    );
};

export default CustomMapView;