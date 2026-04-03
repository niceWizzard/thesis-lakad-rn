import PlaceMarker from '@/src/components/PlaceMarker';
import { StopWithPlace } from '@/src/model/stops.types';
import React from 'react';

interface VisualizingModeMapViewProps {
    show: boolean;
    stops: StopWithPlace[];
    selectedStopIds?: (string | number)[];
}

export function VisualizingModeMapView({ show, stops, selectedStopIds }: VisualizingModeMapViewProps) {
    if (!show) return null;

    return (
        <>
            {stops.map(stop => (
                <PlaceMarker
                    place={stop.place}
                    key={stop.id}
                    allowOverlap={selectedStopIds ? selectedStopIds.includes(stop.id!) : false}
                    isSelected={selectedStopIds ? selectedStopIds.includes(stop.id!) : false}
                />
            ))}
        </>
    );
}
