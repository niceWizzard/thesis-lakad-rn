import { Actionsheet, ActionsheetBackdrop, ActionsheetContent, ActionsheetDragIndicator, ActionsheetDragIndicatorWrapper } from '@/components/ui/actionsheet';
import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Fab, FabIcon } from '@/components/ui/fab';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import ExploreSearchBox from '@/src/components/ExploreSearchBox';
import SearchResultsBox from '@/src/components/SearchResultsBox';
import { historicalLandmarks } from '@/src/constants/Landmarks';
import { Ionicons } from '@expo/vector-icons';
import { Camera, Location, LocationPuck, MapView, MarkerView, UserLocation } from '@rnmapbox/maps';
import { getForegroundPermissionsAsync, requestForegroundPermissionsAsync } from 'expo-location';
import { FileStack, Locate, MapIcon, PlusCircle, Star, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, Pressable, ScrollView, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

const MAP_STYLES = {
    standard: "mapbox://styles/mapbox/standard",
    satellite: "mapbox://styles/mapbox/standard-satellite",
}

const DEFAULT_COORDS: [number, number] = [120.8092, 14.8605];
const TARGET_ZOOM = 15;

const ExploreTab = () => {
    const camera = useRef<Camera>(null);
    const map = useRef<MapView>(null);
    const [userLocation, setUserLocation] = useState<Location>();
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [searchString, setSearchString] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [showResults, setShowResults] = useState(false); // Add this state
    const [mapStyle, setMapStyle] = useState(MAP_STYLES.standard)

    // Animation values
    const slideAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const checkLocationPermission = async () => {
        try {
            // Check if permission is already granted
            let { status } = await getForegroundPermissionsAsync();
            console.log("CHECKING!: ", status);
            if (status !== 'granted')
                await requestForegroundPermissionsAsync();
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        checkLocationPermission()
    }, [])

    // Animate bottom sheet when selectedIndex changes
    useEffect(() => {
        if (selectedIndex !== null) {
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                }),
                Animated.spring(fadeAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                }),
                Animated.spring(fadeAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [selectedIndex]);

    // Handle search focus and results visibility
    useEffect(() => {
        setShowResults(isSearchFocused && searchString.trim().length > 0);
    }, [isSearchFocused, searchString]);

    const centerMapOnCoord = (coordinates: [number, number], zoom?: number) => {
        if (camera.current) {
            camera.current?.setCamera({
                centerCoordinate: coordinates,
                zoomLevel: zoom ?? TARGET_ZOOM,
                animationDuration: 500,
            });
        }
    };

    const handleMarkerPress = (index: number) => {
        setSelectedIndex(index);
        const landmark = historicalLandmarks[index];
        centerMapOnCoord([landmark.longitude, landmark.latitude], 16);
    };

    const handleCloseBottomSheet = () => {
        setSelectedIndex(null);
    };

    const handleLocatePress = () => {
        const coordinates: [number, number] = userLocation?.coords.longitude && userLocation?.coords.latitude
            ? [userLocation.coords.longitude, userLocation.coords.latitude]
            : DEFAULT_COORDS;
        centerMapOnCoord(coordinates);
    };

    const handleSearchResultPress = (id: number) => {
        const index = historicalLandmarks.findIndex(v => v.id == id);
        if (index !== -1) {
            setSelectedIndex(index);
            const landmark = historicalLandmarks[index];
            centerMapOnCoord([landmark.longitude, landmark.latitude], 16);

            // Close search results and clear search
            setShowResults(false);
            setIsSearchFocused(false);
            setSearchString('');
        }
    };

    const handleSearchFocus = () => {
        setIsSearchFocused(true);
        // Don't setSelectedIndex to null here - we might want to keep the current selection
    };

    const handleSearchBlur = () => {
        // Delay hiding results to allow for clicks
        setTimeout(() => {
            setIsSearchFocused(false);
            setShowResults(false);
        }, 200);
    };

    return (
        <VStack style={styles.page}>
            <MapView
                style={styles.map}
                compassEnabled
                compassPosition={{ top: 96, right: 8 }}
                scaleBarPosition={{ bottom: 24, left: 8 }}
                styleURL={mapStyle}
                ref={map}
            >
                <UserLocation
                    onUpdate={(location) => {
                        setUserLocation(location);
                    }}
                />
                <Camera
                    ref={camera}
                    zoomLevel={TARGET_ZOOM}
                    maxZoomLevel={20}
                    minZoomLevel={4}
                    centerCoordinate={DEFAULT_COORDS}
                    animationDuration={250}
                />
                <LocationPuck visible />

                {historicalLandmarks.map((landmark, index) => (
                    <MarkerView
                        key={`landmark-${landmark.id}`}
                        coordinate={[landmark.longitude, landmark.latitude]}
                    >
                        <Box style={styles.markerContainer}>
                            <Pressable
                                onPress={() => handleMarkerPress(index)}
                                style={({ pressed }) => [
                                    styles.markerButton,
                                    pressed && styles.markerButtonPressed
                                ]}
                            >
                                <Ionicons
                                    name='location-sharp'
                                    size={selectedIndex === index ? 36 : 28}
                                    color={selectedIndex === index ? '#ff4444' : '#4CAF50'}
                                />
                            </Pressable>
                            <Box style={[
                                styles.markerLabel,
                                selectedIndex === index && styles.markerLabelSelected
                            ]}>
                                <Text style={styles.markerLabelText}>{landmark.name}</Text>
                            </Box>
                        </Box>
                    </MarkerView>
                ))}
            </MapView>
            <Actionsheet isOpen={selectedIndex != null} onClose={handleCloseBottomSheet} snapPoints={[45]} >
                <ActionsheetBackdrop />
                <ActionsheetContent >
                    <ActionsheetDragIndicatorWrapper>
                        <ActionsheetDragIndicator />
                    </ActionsheetDragIndicatorWrapper>
                    <Box className='w-full flex-row justify-between' >
                        <Text size='xl' >
                            {selectedIndex !== null ? historicalLandmarks[selectedIndex].name : ''}
                        </Text>
                        <Button
                            onPress={handleCloseBottomSheet}
                            style={styles.closeButton}
                        >
                            <ButtonIcon as={X} />
                        </Button>
                    </Box>
                    <ScrollView className='w-full'>
                        {
                            selectedIndex != null && (
                                <Box className='w-full gap-4 '>
                                    <VStack>
                                        <HStack space='md' className='items-center'>
                                            <Icon as={Star} />
                                            <Text size='lg'>
                                                5/5
                                            </Text>
                                        </HStack>
                                        <HStack space='md' className='items-center'>
                                            <Icon as={MapIcon} />
                                            <Text size='lg'>
                                                {historicalLandmarks[selectedIndex].latitude.toFixed(4)}, {historicalLandmarks[selectedIndex].longitude.toFixed(4)}
                                            </Text>
                                        </HStack>
                                    </VStack>
                                    <Image
                                        source={{
                                            uri: "https://media-cdn.tripadvisor.com/media/photo-s/0f/48/5c/af/random-location.jpg"
                                        }}
                                        width={124}
                                        height={124}

                                        className='w-full '
                                    />
                                    <Button
                                        onPress={() => {
                                            console.log('Add to itinerary:', historicalLandmarks[selectedIndex].name);
                                        }}
                                    >
                                        <ButtonIcon as={PlusCircle} />
                                        <ButtonText>Add to Itinerary </ButtonText>
                                    </Button>
                                </Box>
                            )
                        }
                    </ScrollView>
                </ActionsheetContent>
            </Actionsheet>
            {/* Search Box */}
            <ExploreSearchBox
                onSearch={setSearchString}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                value={searchString}
            />

            {/* Search Results */}
            <SearchResultsBox
                searchString={searchString}
                onResultPress={handleSearchResultPress}
                visible={showResults}
            />
            {/* Locate Button */}
            <Fab
                onPress={handleLocatePress}
                size='xl'
            >
                <FabIcon as={Locate} size='xl' />
            </Fab>
            <Fab
                onPress={() => {
                    setMapStyle(
                        mapStyle === MAP_STYLES.standard ? MAP_STYLES.satellite : MAP_STYLES.standard
                    )
                }}
                size='md'
                placement='top right'
                className='mt-40'
            >
                <FabIcon as={FileStack} size='lg' />
            </Fab>
        </VStack>
    );
};

// ... keep your existing styles the same ...

const styles = StyleSheet.create({
    page: {
        flex: 1,
        height: "100%",
        width: "100%",
    },
    map: {
        flex: 1
    },
    markerContainer: {
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    markerButton: {
        padding: 4,
    },
    markerButtonPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.95 }]
    },
    markerLabel: {
        backgroundColor: 'white',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
        maxWidth: 120,
    },
    markerLabelSelected: {
        backgroundColor: '#ffebee',
        borderColor: '#ff4444',
        borderWidth: 1,
    },
    markerLabelText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'black',
    },
    overlayPressable: {
        flex: 1,
    },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 34, // Safe area for home indicator
        maxHeight: height * 0.4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
    },
    bottomSheetHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#ccc',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 12,
    },
    bottomSheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    bottomSheetTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        flex: 1,
        color: '#1f2937',
    },
    closeButton: {
        padding: 4,
    },
    bottomSheetContent: {
        gap: 16,
    },
    landmarkDescription: {
        fontSize: 14,
        lineHeight: 20,
        color: '#6b7280',
    },
    landmarkDetails: {
        gap: 8,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailText: {
        fontSize: 12,
        color: '#6b7280',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#2563eb',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginTop: 8,
    },
    addButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    locateButton: {
        position: 'absolute',
        bottom: 24,
        right: 16,
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    locateButtonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.95 }]
    },
});

export default ExploreTab;