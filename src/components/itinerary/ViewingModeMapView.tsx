import LandmarkMarker from '@/src/components/LandmarkMarker';
import { StopWithPlace } from '@/src/model/stops.types';
import React from 'react';

interface ViewingModeMapViewProps {
    show: boolean;
    stops: StopWithPlace[];
    onStopPress: (stop: StopWithPlace) => void;
}

export function ViewingModeMapView({ show, stops, onStopPress }: ViewingModeMapViewProps) {
    if (!show) return null;

    return (
        <>
            {stops.map(stop => (
                <LandmarkMarker
                    landmark={stop.place}
                    key={stop.id}
                    allowOverlap
                    handleMarkerPress={() => onStopPress(stop)}
                />
            ))}
        </>
    );
}
