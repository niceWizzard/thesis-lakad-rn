import PlaceMarker from '@/src/components/PlaceMarker';
import { StopWithPlace } from '@/src/model/stops.types';
import React from 'react';

interface ViewingModeMapViewProps {
    show: boolean;
    stops: StopWithPlace[];
    onStopPress: (stop: StopWithPlace) => void;
    selectedStopIds?: (string | number)[];
}

export function ViewingModeMapView({ show, stops, onStopPress, selectedStopIds }: ViewingModeMapViewProps) {
    if (!show) return null;

    return (
        <>
            {stops.map(stop => (
                <PlaceMarker
                    place={stop.place}
                    key={stop.id}
                    allowOverlap={selectedStopIds ? selectedStopIds.includes(stop.id!) : false}
                    handleMarkerPress={() => onStopPress(stop)}
                    isSelected={selectedStopIds ? selectedStopIds.includes(stop.id!) : false}
                />
            ))}
        </>
    );
}
