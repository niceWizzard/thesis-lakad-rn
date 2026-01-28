import LandmarkMarker from '@/src/components/LandmarkMarker';
import { StopWithLandmark } from '@/src/model/stops.types';
import React from 'react';

interface ViewingModeMapViewProps {
    show: boolean;
    stops: StopWithLandmark[];
}

export function ViewingModeMapView({ show, stops }: ViewingModeMapViewProps) {
    if (!show) return null;

    return (
        <>
            {stops.map(stop => (
                <LandmarkMarker
                    landmark={stop.landmark}
                    key={stop.id}
                />
            ))}
        </>
    );
}
