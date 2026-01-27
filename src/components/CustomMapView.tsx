import { Camera, LocationPuck, MapView } from '@rnmapbox/maps';
import React, { ComponentProps } from 'react';

import { Box } from '@/components/ui/box';



const DEFAULT_COORDS: [number, number] = [120.8092, 14.8605];

interface LandmarkMapViewProps {
    cameraRef: React.RefObject<Camera | null>;
    children?: React.ReactNode;
    overlays?: React.ReactNode;
    mapViewProps?: ComponentProps<typeof MapView>,
    cameraProps?: ComponentProps<typeof Camera>,
}

const CustomMapView = ({
    cameraRef,
    children,        // Content INSIDE the MapView (Markers, Shapes)
    overlays,        // Content OUTSIDE the MapView (FABs, Search)
    mapViewProps,
    cameraProps,
}: LandmarkMapViewProps) => {
    return (
        <Box className="flex-1 bg-background-0">
            <MapView
                style={{ flex: 1 }}
                {...mapViewProps}
            >
                <Camera ref={cameraRef}
                    defaultSettings={{
                        centerCoordinate: DEFAULT_COORDS, zoomLevel: 12,
                    }}
                    minZoomLevel={8}
                    maxBounds={{
                        ne: [122, 17],
                        sw: [119, 13],
                    }}
                    {...cameraProps}
                />
                <LocationPuck pulsing={{ isEnabled: true }} />
                {children}
            </MapView>

            {/* UI Overlays */}
            {overlays}


        </Box>
    );
};

export default CustomMapView;