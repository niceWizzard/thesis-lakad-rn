import LandmarkMarker from '@/src/components/LandmarkMarker';
import { Place } from '@/src/model/places.types';
import React from 'react';

interface NavigatingModeMapViewProps {
    show: boolean;
    targetLandmark: Place | null;
}

export function NavigatingModeMapView({ show, targetLandmark }: NavigatingModeMapViewProps) {
    if (!show || !targetLandmark) return null;

    return (
        <LandmarkMarker
            landmark={targetLandmark}
            isSelected
        />
    );
}
