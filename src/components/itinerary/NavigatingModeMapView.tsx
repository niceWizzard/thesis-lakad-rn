import LandmarkMarker from '@/src/components/LandmarkMarker';
import { Landmark } from '@/src/model/landmark.types';
import React from 'react';

interface NavigatingModeMapViewProps {
    show: boolean;
    targetLandmark: Landmark | null;
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
