import ExploreSearchBox from '@/src/components/ExploreSearchBox';
import SearchResultsBox from '@/src/components/SearchResultsBox';
import { Text, View } from '@/src/components/Themed';
import { historicalLandmarks } from '@/src/constants/Landmarks';
import { Ionicons } from '@expo/vector-icons';
import { Camera, Location, LocationPuck, MapView, MarkerView, UserLocation } from '@rnmapbox/maps';
import { getForegroundPermissionsAsync, requestForegroundPermissionsAsync } from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Pressable, StyleSheet, TouchableOpacity } from 'react-native';

const { width, height } = Dimensions.get('window');
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

    const bottomSheetTranslateY = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [300, 0]
    });

    const overlayOpacity = fadeAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.5]
    });

    return (
        <View style={styles.page}>
            <MapView 
                style={styles.map}
                compassEnabled
                compassPosition={{ top: 96, right: 8 }}
                scaleBarPosition={{ bottom: 24, left: 8 }}
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
                        <View style={styles.markerContainer}>
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
                            <View style={[
                                styles.markerLabel,
                                selectedIndex === index && styles.markerLabelSelected
                            ]}>
                                <Text style={styles.markerLabelText}>{landmark.name}</Text>
                            </View>
                        </View>
                    </MarkerView>
                ))}
            </MapView>

            {/* Overlay when bottom sheet is open */}
            {selectedIndex !== null && (
                <Animated.View 
                    style={[
                        styles.overlay,
                        { opacity: overlayOpacity }
                    ]}
                >
                    <Pressable 
                        style={styles.overlayPressable}
                        onPress={handleCloseBottomSheet}
                    />
                </Animated.View>
            )}

            {/* Bottom Sheet */}
            <Animated.View 
                style={[
                    styles.bottomSheet,
                    {
                        transform: [{ translateY: bottomSheetTranslateY }]
                    }
                ]}
            >
                <View style={styles.bottomSheetHandle} />
                
                <View style={styles.bottomSheetHeader}>
                    <Text style={styles.bottomSheetTitle}>
                        {selectedIndex !== null ? historicalLandmarks[selectedIndex].name : ''}
                    </Text>
                    <Pressable 
                        onPress={handleCloseBottomSheet}
                        style={styles.closeButton}
                    >
                        <Ionicons name='close' size={24} color="#666" />
                    </Pressable>
                </View>

                {selectedIndex !== null && (
                    <View style={styles.bottomSheetContent}>
                        <View style={styles.landmarkDetails}>
                            <View style={styles.detailItem}>
                                <Ionicons name="location-outline" size={16} color="#666" />
                                <Text style={styles.detailText}>
                                    {historicalLandmarks[selectedIndex].latitude.toFixed(4)}, {historicalLandmarks[selectedIndex].longitude.toFixed(4)}
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={styles.addButton}
                            onPress={() => {
                                // Add to itinerary logic here
                                console.log('Add to itinerary:', historicalLandmarks[selectedIndex].name);
                            }}
                        >
                            <Ionicons name="add-circle-outline" size={20} color="white" />
                            <Text style={styles.addButtonText}>Add To Itinerary</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </Animated.View>

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
            <Pressable 
                onPress={handleLocatePress}
                style={({ pressed }) => [
                    styles.locateButton,
                    pressed && styles.locateButtonPressed
                ]}
            >
                <Ionicons name='locate' size={24} color="#2563eb" />
            </Pressable>
        </View>
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