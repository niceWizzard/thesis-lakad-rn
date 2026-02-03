import React, { ComponentProps, useMemo, useState } from 'react';

import ExploreSearchBox from '@/src/components/ExploreSearchBox';
import SearchResultsBox from '@/src/components/SearchResultsBox';
import { Landmark } from '@/src/model/landmark.types';

import CustomMapView from '@/src/components/CustomMapView';
import MapFabs from '@/src/components/MapFabs';
import { StyleURL } from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { Keyboard, View } from 'react-native';
import { CopilotStep, walkthroughable } from 'react-native-copilot';
import { useUserLocation } from '../hooks/useUserLocation';
import LandmarkMarker from './LandmarkMarker';


const CopilotView = walkthroughable(View);

const LandmarkMapView = ({
    children,
    mapViewProps,
    overlays,
    landmarks,
    selectedLandmark,
    setSelectedLandmark,
    cameraRef,
    tutorialStep, // Add tutorialStep to destructuring
    // Tutorial props here
}: {
    landmarks: Landmark[]
    selectedLandmark: Landmark | null
    setSelectedLandmark: React.Dispatch<React.SetStateAction<Landmark | null>>
    tutorialStep?: {
        name: string;
        text: string;
        order: number;
    }
} & Pick<ComponentProps<typeof CustomMapView>, 'children' | 'mapViewProps' | 'overlays' | 'cameraRef'>) => {
    const camera = cameraRef;
    const userLocation = useUserLocation();
    const [searchString, setSearchString] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [mapStyleUrl, setMapStyleUrl] = useState(StyleURL.Street)
    const [isMapReady, setIsMapReady] = useState(false);


    // Filter results based on search
    const showResults = useMemo(() =>
        isSearchFocused,
        [isSearchFocused]);

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
        // If we have the location from the hook, use it
        if (userLocation) {
            centerMap(userLocation);
            return;
        }

        // Fallback: Check permission status again in case they changed it in settings
        let { status } = await Location.getForegroundPermissionsAsync();

        // If not granted, try requesting it now
        if (status !== 'granted') {
            const request = await Location.requestForegroundPermissionsAsync();
            status = request.status;
        }

        if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({});
            const coords: [number, number] = [loc.coords.longitude, loc.coords.latitude];
            centerMap(coords);       // Fly there
        } else {
            // Optional: Alert the user that permission is required
            console.warn("Location permission denied");
        }
    };

    return (
        <CustomMapView
            onDidFinishLoadingStyle={() => {
                setIsMapReady(true);
            }}
            mapViewProps={{
                styleURL: mapStyleUrl,
                logoEnabled: false,
                attributionEnabled: false,
                onPress: () => {
                    setSelectedLandmark(null);
                    setIsSearchFocused(false);
                    Keyboard.dismiss();
                },
                compassEnabled: true,
                compassPosition: { top: 96, right: 8 },
                scaleBarPosition: { bottom: 16, left: 16 },
                ...mapViewProps,
            }}
            cameraRef={camera}
            overlays={(
                <>
                    {
                        tutorialStep ? (
                            <CopilotStep
                                text={tutorialStep.text}
                                order={tutorialStep.order}
                                name={tutorialStep.name}
                            >
                                <CopilotView>
                                    <ExploreSearchBox
                                        onSearch={setSearchString}
                                        onFocus={() => setIsSearchFocused(true)}
                                        onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                        value={searchString}
                                    />
                                </CopilotView>
                            </CopilotStep>
                        ) : (
                            <ExploreSearchBox
                                onSearch={setSearchString}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                value={searchString}
                            />
                        )
                    }

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
                        setMapStyle={(style) => {
                            setIsMapReady(false);
                            setMapStyleUrl(style);
                        }}
                        mapStyle={mapStyleUrl}
                    />
                    {
                        overlays
                    }
                </>
            )}
        >
            {
                isMapReady && landmarks.map(v => (
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