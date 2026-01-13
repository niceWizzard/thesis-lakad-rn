import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';

import { Landmark, LandmarkCategory } from '@/src/model/landmark.types';
import { useLandmarkStore } from '@/src/stores/useLandmarkStore';

import CustomMapView from '@/src/components/CustomMapView';
import { Camera } from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';


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

const ItineraryDetailsScreen = () => {
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
        <CustomMapView
            isSheetOpen={false}
            onSheetClose={() => null}
            cameraRef={camera}
        />
    );
};

const styles = StyleSheet.create({
    map: { flex: 1 },
});

export default ItineraryDetailsScreen;