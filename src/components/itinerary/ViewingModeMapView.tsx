import PlaceMarker from '@/src/components/PlaceMarker';
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
                <PlaceMarker
                    place={stop.place}
                    key={stop.id}
                    allowOverlap
                    handleMarkerPress={() => onStopPress(stop)}
                />
            ))}
        </>
    );
}
