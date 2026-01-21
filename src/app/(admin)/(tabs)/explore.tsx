import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import React, { useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet } from 'react-native';

import { Landmark } from '@/src/model/landmark.types';

import { Badge, BadgeText } from '@/components/ui/badge';
import LandmarkMapView from '@/src/components/LandmarkMapView';
import { useLandmarks } from '@/src/hooks/useLandmarks';
import { Camera } from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Edit2, Info, MapPin, Star } from 'lucide-react-native';

const AdminExploreTab = () => {
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);
    const router = useRouter();
    const camera = useRef<Camera | null>(null)


    const { landmarks } = useLandmarks();

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

    return (
        <LandmarkMapView
            mapViewProps={{
                style: styles.map,
                logoEnabled: false,
                attributionEnabled: false,
                onPress: () => setSelectedLandmark(null),
                compassEnabled: true,
                compassPosition: { top: 96, right: 8 },
            }}
            cameraRef={camera}
            selectedLandmark={selectedLandmark}
            setSelectedLandmark={setSelectedLandmark}
            landmarks={landmarks}
            sheetContent={(
                <>
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
                                                {selectedLandmark.gmaps_rating ?? '0.0'}
                                            </Text>
                                        </HStack>
                                    </HStack>

                                    <HStack space="xs" className="flex-wrap mt-2">
                                        <Badge action="info" variant="outline" className="rounded-md">
                                            <BadgeText className="text-[10px] uppercase font-bold">{selectedLandmark.type}</BadgeText>
                                        </Badge>
                                    </HStack>
                                </VStack>

                                <Image
                                    source={{ uri: selectedLandmark.image_url || "https://via.placeholder.com/600x400" }}
                                    className="w-full h-56 rounded-3xl bg-background-100"
                                    resizeMode="cover"
                                />

                                <Box className="bg-background-50 p-4 rounded-2xl border border-outline-100">
                                    <Text size="sm" className="text-typography-600 leading-relaxed" numberOfLines={3}>
                                        {selectedLandmark.description}
                                    </Text>
                                </Box>

                                {/* Action Buttons */}
                                <HStack space="md" className="mb-4">
                                    <Button
                                        className="flex-1 rounded-2xl h-14 bg-primary-600"
                                        onPress={() => {
                                            const id = selectedLandmark.id;
                                            router.navigate({ pathname: '/(admin)/landmark/[id]', params: { id } });
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
                                            const id = selectedLandmark.id;
                                            router.navigate(`/(admin)/landmark/${id}/edit`);
                                        }}
                                    >
                                        <ButtonIcon as={Edit2} />
                                    </Button>
                                </HStack>
                            </VStack>
                        </ScrollView>
                    )}
                </>
            )}
        />
    );
};

const styles = StyleSheet.create({
    map: { flex: 1 },
});

export default AdminExploreTab;