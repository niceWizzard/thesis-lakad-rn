import LandmarkMarker from '@/src/components/LandmarkMarker';
import { StopWithLandmark } from '@/src/model/stops.types';
import React from 'react';

interface ViewingModeMapViewProps {
    show: boolean;
    stops: StopWithLandmark[];
    onStopPress: (stop: StopWithLandmark) => void;
}

export function ViewingModeMapView({ show, stops, onStopPress }: ViewingModeMapViewProps) {
    if (!show) return null;

    return (
        <>
            {stops.map(stop => (
                <LandmarkMarker
                    landmark={stop.landmark}
                    key={stop.id}
                    allowOverlap
                    handleMarkerPress={() => onStopPress(stop)}
                />
            ))}
        </>
    );
}
