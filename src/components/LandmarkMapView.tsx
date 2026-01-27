import React, { ComponentProps, useEffect, useMemo, useState } from 'react';

import ExploreSearchBox from '@/src/components/ExploreSearchBox';
import SearchResultsBox from '@/src/components/SearchResultsBox';
import { Landmark } from '@/src/model/landmark.types';

import CustomMapView from '@/src/components/CustomMapView';
import MapFabs from '@/src/components/MapFabs';
import { StyleURL } from '@rnmapbox/maps';
import * as Location from 'expo-location';
import LandmarkMarker from './LandmarkMarker';




const LandmarkMapView = ({
    children,
    mapViewProps,
    overlays,
    landmarks,
    selectedLandmark,
    setSelectedLandmark,
    cameraRef,
}: {
    landmarks: Landmark[]
    selectedLandmark: Landmark | null
    setSelectedLandmark: React.Dispatch<React.SetStateAction<Landmark | null>>,
} & Pick<ComponentProps<typeof CustomMapView>, 'children' | 'mapViewProps' | 'overlays' | 'cameraRef'>) => {
    const camera = cameraRef;
    const [, setUserLocation] = useState<[number, number] | null>(null);
    const [searchString, setSearchString] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [mapStyleUrl, setMapStyleUrl] = useState(StyleURL.Street)


    // Filter results based on search
    const showResults = useMemo(() =>
        isSearchFocused && searchString.trim().length > 0,
        [isSearchFocused, searchString]);

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;
            const loc = await Location.getCurrentPositionAsync({});
            setUserLocation([loc.coords.longitude, loc.coords.latitude]);
        })();
    }, []);

    useEffect(() => {
        let subscription: Location.LocationSubscription | null = null;

        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            // WatchPositionAsync will update userLocation whenever they move
            // and importantly, it will start working as soon as permissions are granted
            subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.Balanced,
                    timeInterval: 5000,
                    distanceInterval: 10,
                },
                (loc) => {
                    setUserLocation([loc.coords.longitude, loc.coords.latitude]);
                }
            );
        })();

        return () => {
            if (subscription) subscription.remove();
        };
    }, []);

    const centerMap = (coords: [number, number], zoom = 20) => {
        camera.current?.setCamera({
            centerCoordinate: [coords[0], coords[1] + 0.000055],
            zoomLevel: zoom,
            animationDuration: 1000,
        });
    };

    const handleMarkerPress = (landmark: Landmark) => {
        setSelectedLandmark(landmark);
        centerMap([landmark.longitude, landmark.latitude]);
    };

    const handleLocatePress = async () => {
        // Check permission status again in case they changed it in settings
        let { status } = await Location.getForegroundPermissionsAsync();

        // If not granted, try requesting it now
        if (status !== 'granted') {
            const request = await Location.requestForegroundPermissionsAsync();
            status = request.status;
        }

        if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({});
            const coords: [number, number] = [loc.coords.longitude, loc.coords.latitude];
            setUserLocation(coords); // Sync state
            centerMap(coords);       // Fly there
        } else {
            // Optional: Alert the user that permission is required
            console.warn("Location permission denied");
        }
    };

    return (
        <CustomMapView
            mapViewProps={{
                styleURL: mapStyleUrl,
                logoEnabled: false,
                attributionEnabled: false,
                onPress: () => setSelectedLandmark(null),
                compassEnabled: true,
                compassPosition: { top: 96, right: 8 },
                ...mapViewProps,
            }}
            cameraRef={camera}
            overlays={(
                <>
                    <ExploreSearchBox
                        onSearch={setSearchString}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                        value={searchString}
                    />

                    <SearchResultsBox
                        searchString={searchString}
                        onResultPress={(id) => {
                            const landmark = landmarks.find(l => l.id === id);
                            if (landmark) handleMarkerPress(landmark);
                            setSearchString('');
                        }}
                        visible={showResults}
                    />

                    {/* Map Controls (FABs) */}
                    <MapFabs
                        handleLocatePress={handleLocatePress}
                        setMapStyle={setMapStyleUrl}
                    />
                    {
                        overlays
                    }
                </>
            )}
        >
            {
                landmarks.map(v => (
                    <LandmarkMarker
                        landmark={v}
                        key={v.id}
                        isSelected={selectedLandmark?.id === v.id}
                        handleMarkerPress={handleMarkerPress}
                    />
                ))
            }

            {
                children
            }
        </CustomMapView>
    );
};


export default LandmarkMapView;