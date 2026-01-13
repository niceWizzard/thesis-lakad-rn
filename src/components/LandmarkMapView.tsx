import React, { ComponentProps, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';

import ExploreSearchBox from '@/src/components/ExploreSearchBox';
import SearchResultsBox from '@/src/components/SearchResultsBox';
import { Landmark, LandmarkCategory } from '@/src/model/landmark.types';

import CustomMapView from '@/src/components/CustomMapView';
import MapFabs, { MAP_STYLES } from '@/src/components/MapFabs';
import { Camera, Images, ShapeSource, SymbolLayer } from '@rnmapbox/maps';
import * as Location from 'expo-location';



const DEFAULT_COORDS: [number, number] = [120.8092, 14.8605];

const IconImage = require("@/assets/images/red_marker.png")
const WaterPin = require("@/assets/images/categories/water.png")
const LandscapePin = require("@/assets/images/categories/landscape.png")
const NaturePin = require("@/assets/images/categories/nature.png")
const HistoryPin = require("@/assets/images/categories/history.png")
const ReligiousPin = require("@/assets/images/categories/religious.png")

function getPin(category: LandmarkCategory) {
    switch (category) {
        case 'History':
            return 'HistoryPin';
        case 'Landscape':
            return 'LandscapePin';
        case 'Nature':
            return 'NaturePin';
        case 'Religious':
            return 'ReligiousPin';
        default:
            return 'IconImage';
    }
}

const LandmarkMapView = ({
    sheetContent,
    children,
    mapViewProps,
    overlays,
    landmarks,
    selectedLandmark,
    setSelectedLandmark
}: {
    landmarks: Landmark[]
    selectedLandmark: Landmark | null
    setSelectedLandmark: React.Dispatch<React.SetStateAction<Landmark | null>>
} & Pick<ComponentProps<typeof CustomMapView>, 'children' | 'mapViewProps' | 'overlays' | 'sheetContent'>) => {
    const camera = useRef<Camera>(null);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [mapStyle, setMapStyle] = useState(MAP_STYLES.standard);
    const [searchString, setSearchString] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);


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

    const centerMap = (coords: [number, number], zoom = 15) => {
        camera.current?.setCamera({
            centerCoordinate: coords,
            zoomLevel: zoom,
            animationDuration: 1000,
        });
    };

    const handleMarkerPress = (landmark: Landmark) => {
        setSelectedLandmark(landmark);
        centerMap([landmark.longitude, landmark.latitude], 16);
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
                style: styles.map,
                styleURL: mapStyle,
                logoEnabled: false,
                attributionEnabled: false,
                onPress: () => setSelectedLandmark(null),
                compassEnabled: true,
                compassPosition: { top: 96, right: 8 },
                ...mapViewProps
            }}
            cameraRef={camera}
            isSheetOpen={selectedLandmark != null}
            onSheetClose={() => setSelectedLandmark(null)}
            sheetContent={(
                sheetContent
            )}
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
                        setMapStyle={setMapStyle}
                    />
                    {
                        overlays
                    }
                </>
            )}
        >
            <ShapeSource
                id='landmark-shape-source'
                shape={{
                    type: 'FeatureCollection',
                    features: landmarks.map((landmark) => ({
                        type: 'Feature',
                        id: landmark.id,
                        properties: {
                            title: landmark.name,
                            icon: getPin(landmark.categories[Math.floor(Math.random() * landmark.categories.length)]),
                        },
                        geometry: {
                            type: 'Point',
                            coordinates: [landmark.longitude, landmark.latitude],
                        },
                    })),
                }}
                onPress={(event) => {
                    const landmark = landmarks.find((landmark) => landmark.id == event.features[0].id) || null
                    if (landmark)
                        handleMarkerPress(landmark)
                }}

            >
                <Images
                    images={{
                        IconImage: IconImage,      // Default/Fallback
                        HistoryPin: HistoryPin,
                        LandscapePin: LandscapePin,
                        NaturePin: NaturePin,
                        ReligiousPin: ReligiousPin,
                        WaterPin: WaterPin,
                    }}
                />
                <SymbolLayer
                    id={'symbol-layer'}
                    style={{
                        textField: ['get', 'title'],
                        textAnchor: 'top',
                        textOffset: [0, .5],
                        iconSize: 1,
                        iconImage: ['get', 'icon'],
                    }}
                />
            </ShapeSource>
            {
                children
            }
        </CustomMapView>
    );
};

const styles = StyleSheet.create({
    map: { flex: 1 },
});

export default LandmarkMapView;