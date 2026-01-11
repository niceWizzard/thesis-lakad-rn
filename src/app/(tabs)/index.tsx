import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Fab, FabIcon } from '@/components/ui/fab';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet } from 'react-native';

import ExploreSearchBox from '@/src/components/ExploreSearchBox';
import SearchResultsBox from '@/src/components/SearchResultsBox';
import { Landmark, LandmarkCategory } from '@/src/model/landmark.types';
import { useLandmarkStore } from '@/src/stores/useLandmarkStore';

import { Badge, BadgeText } from '@/components/ui/badge';
import { CustomLocalSheet } from '@/src/components/CustomLocalSheet';
import { Camera, Images, LocationPuck, MapView, ShapeSource, SymbolLayer } from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Info, Layers, LocateFixed, MapPin, Navigation, Star } from 'lucide-react-native';


const MAP_STYLES = {
    standard: "mapbox://styles/mapbox/standard",
    satellite: "mapbox://styles/mapbox/standard-satellite",
};

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

const ExploreTab = () => {
    const camera = useRef<Camera>(null);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);
    const [mapStyle, setMapStyle] = useState(MAP_STYLES.standard);
    const [searchString, setSearchString] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const router = useRouter();

    const landmarks = useLandmarkStore(v => v.landmarks);

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
        <Box className="flex-1 bg-background-0">
            <MapView
                style={styles.map}
                styleURL={mapStyle}
                logoEnabled={false}
                attributionEnabled={false}
                onPress={() => setSelectedLandmark(null)}
                compassEnabled
                compassPosition={{ top: 96, right: 8 }}
            >
                <Camera
                    ref={camera}
                    defaultSettings={{ centerCoordinate: DEFAULT_COORDS, zoomLevel: 12 }}
                />

                <LocationPuck
                    puckBearingEnabled
                    puckBearing="heading"
                    pulsing={{ isEnabled: true, color: '#2563eb' }}
                />
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
            </MapView>

            {/* Floating UI Overlays */}
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
            <Fab
                onPress={() => setMapStyle(prev => prev === MAP_STYLES.standard ? MAP_STYLES.satellite : MAP_STYLES.standard)}
                size="md"
                placement='top right'
                className='mt-40'
            >
                <FabIcon as={Layers} className="text-typography-700" />
            </Fab>
            <Fab
                onPress={handleLocatePress}
                size="lg"
                placement='bottom right'
            >
                <FabIcon as={LocateFixed} />
            </Fab>

            {/* Landmark Details Sheet */}
            <CustomLocalSheet isOpen={selectedLandmark != null} onClose={() => setSelectedLandmark(null)}>
                {selectedLandmark && (
                    <ScrollView className="w-full px-4" showsVerticalScrollIndicator={false}>
                        <VStack className="gap-5 mt-4">
                            <VStack className="gap-2">
                                <HStack className="justify-between items-start">
                                    <VStack className="flex-1">
                                        <Heading size="xl" className="text-typography-900">
                                            {selectedLandmark.name}
                                        </Heading>
                                        <HStack space="xs" className="mt-1 items-center">
                                            <Icon as={MapPin} size="xs" className="text-typography-400" />
                                            <Text size="xs" className="text-typography-500 font-medium">
                                                {selectedLandmark.municipality}, District {selectedLandmark.district}
                                            </Text>
                                        </HStack>
                                    </VStack>

                                    <HStack className="items-center bg-warning-50 px-3 py-1 rounded-full border border-warning-100">
                                        <Icon as={Star} size="xs" className="text-warning-600 mr-1" fill="#d97706" />
                                        <Text size="sm" className="font-bold text-warning-700">
                                            {selectedLandmark.gmaps_rating?.toFixed(1) ?? '0.0'}
                                        </Text>
                                    </HStack>
                                </HStack>

                                <HStack space="xs" className="flex-wrap mt-2">
                                    {selectedLandmark.categories?.map(cat => (
                                        <Badge key={cat} action="info" variant="outline" className="rounded-md">
                                            <BadgeText className="text-[10px] uppercase font-bold">{cat}</BadgeText>
                                        </Badge>
                                    ))}
                                </HStack>
                            </VStack>

                            <Image
                                source={{ uri: selectedLandmark.image_url || "https://via.placeholder.com/600x400" }}
                                className="w-full h-52 rounded-3xl bg-background-100"
                                resizeMode="cover"
                            />

                            <Box className="bg-background-50 p-4 rounded-2xl border border-outline-100">
                                <Text size="sm" className="text-typography-600 leading-relaxed" numberOfLines={3}>
                                    {selectedLandmark.description || "No description available for this landmark."}
                                </Text>
                            </Box>

                            <HStack space="md" className="mb-4">
                                <Button
                                    className="flex-1 rounded-2xl h-14 bg-primary-600"
                                    onPress={() => {
                                        router.push({
                                            pathname: '/landmark/[id]/view',
                                            params: { id: selectedLandmark.id.toString() },
                                        });
                                    }}
                                >
                                    <ButtonIcon as={Info} className="mr-2" />
                                    <ButtonText className="font-bold">Full Details</ButtonText>
                                </Button>

                                <Button
                                    variant="outline"
                                    action="secondary"
                                    className="rounded-2xl h-14 w-16 border-outline-300"
                                    onPress={() => {
                                        // Logic for external maps can go here
                                    }}
                                >
                                    <ButtonIcon as={Navigation} className="text-primary-600" />
                                </Button>
                            </HStack>
                        </VStack>
                    </ScrollView>
                )}
            </CustomLocalSheet>
        </Box>
    );
};

const styles = StyleSheet.create({
    map: { flex: 1 },
});

export default ExploreTab;