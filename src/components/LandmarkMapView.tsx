import React, { ComponentProps, useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet } from 'react-native';

import ExploreSearchBox from '@/src/components/ExploreSearchBox';
import SearchResultsBox from '@/src/components/SearchResultsBox';
import { Landmark } from '@/src/model/landmark.types';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import CustomMapView from '@/src/components/CustomMapView';
import MapFabs from '@/src/components/MapFabs';
import { MarkerView, StyleURL } from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { Pressable } from 'react-native-gesture-handler';



const DEFAULT_COORDS: [number, number] = [120.8092, 14.8605];

const IconImage = require("@/assets/images/red_marker.png")
const WaterPin = require("@/assets/images/categories/water.png")
const LandscapePin = require("@/assets/images/categories/landscape.png")
const NaturePin = require("@/assets/images/categories/nature.png")
const HistoryPin = require("@/assets/images/categories/history.png")
const ReligiousPin = require("@/assets/images/categories/religious.png")


const LandmarkMapView = ({
    sheetContent,
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
} & Pick<ComponentProps<typeof CustomMapView>, 'children' | 'mapViewProps' | 'overlays' | 'sheetContent' | 'cameraRef'>) => {
    const camera = cameraRef;
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
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

    const centerMap = (coords: [number, number], zoom = 18) => {
        camera.current?.setCamera({
            centerCoordinate: coords,
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
                    <MarkerView
                        key={v.id}
                        coordinate={[v.longitude, v.latitude]}
                        anchor={{ x: 0.5, y: 1 }} // Ensures the bottom of the pin touches the coordinate
                        allowOverlapWithPuck
                    >
                        <Pressable onPress={() => handleMarkerPress(v)} style={{ alignItems: 'center' }}>
                            {/* Avatar Container */}
                            <Box
                                style={{ elevation: 5 }}

                                className={`p-1 bg-background-900 rounded-full shadow-lg 
                                    ${selectedLandmark?.id === v.id ? 'border border-primary-500' : ''}`
                                }
                            >
                                <Image
                                    source={{ uri: v.image_url || "https://via.placeholder.com/150" }}
                                    style={{ width: 24, height: 24, borderRadius: 22 }}
                                />
                            </Box>

                            {/* The "Pointer" Triangle */}
                            <Box
                                className="bg-primary-500"
                                style={{
                                    width: 12,
                                    height: 12,
                                    transform: [{ rotate: '45deg' }],
                                    marginTop: -6,
                                    zIndex: -1
                                }}
                            />

                            {/* Label with better padding */}
                            <Box className="mt-1 bg-background-100 px-2 py-0.5 rounded-full border border-outline-100 shadow-sm max-w-24">
                                <Text size="xs" numberOfLines={1} className="font-semibold text-typography-900">
                                    {v.name}
                                </Text>
                            </Box>
                        </Pressable>
                    </MarkerView>
                ))
            }

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