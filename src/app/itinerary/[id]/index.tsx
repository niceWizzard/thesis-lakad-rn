import {
    Camera,
    Images,
    LineLayer,
    LocationPuck,
    MapView,
    ShapeSource,
    SymbolLayer
} from '@rnmapbox/maps';
import { useQuery } from '@tanstack/react-query';
import { feature, featureCollection } from '@turf/turf';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Pressable, ScrollView, StyleSheet, ToastAndroid } from 'react-native';

// UI Components
import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { CustomLocalSheet } from '@/src/components/CustomLocalSheet';

// Logic & Types
import { POI } from '@/src/model/poi.types';
import { useAuthStore } from '@/src/stores/useAuth';
import { fetchDirections, MapboxRoute } from '@/src/utils/fetchDirections';
import { fetchItineraryById } from '@/src/utils/fetchItineraries';
import { supabase } from '@/src/utils/supabase';

// Icons
import AlgorithmModule from '@/modules/algorithm-module/src/AlgorithmModule';
import { fetchDistanceMatrix } from '@/src/utils/fetchDistanceMatrix';
import {
    ArrowDownUp,
    ArrowUp,
    Check,
    CheckCircle,
    ChevronLeft,
    Clock,
    LocateFixed,
    Navigation,
    Navigation2,
    PlusCircle
} from 'lucide-react-native';

const poiIcon = require('@/assets/images/red_marker.png');
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

enum Mode {
    Viewing,
    Navigating,
}

export default function ItineraryView() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const camera = useRef<Camera>(null);

    // UI State
    const [mode, setMode] = useState<Mode>(Mode.Viewing);
    const [isSheetOpen, setIsSheetOpen] = useState(true);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [navigationRoute, setNavigationRoute] = useState<MapboxRoute[]>([]);

    const { session } = useAuthStore();
    const userId = session?.user.id;

    const { data: itinerary, isLoading, refetch } = useQuery({
        queryKey: ['itinerary', id],
        enabled: !!userId && !!id,
        queryFn: async () => fetchItineraryById(userId!, Number.parseInt(id.toString()))
    });

    // Smart logic: find the first unvisited stop
    const nextUnvisitedStop = useMemo(() => {
        if (!itinerary) return null;
        return itinerary.stops.find(stop => !stop.visited_at) || null;
    }, [itinerary]);

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;
            const loc = await Location.getCurrentPositionAsync({});
            setUserLocation([loc.coords.longitude, loc.coords.latitude]);
        })();
    }, []);

    // Memoized GeoJSON for markers
    const poiFeatures = useMemo(() => {
        if (!itinerary) return featureCollection([]);
        return featureCollection(
            itinerary.stops.map((stop) => feature({
                type: 'Point',
                coordinates: [stop.landmark.longitude, stop.landmark.latitude],
            }, {
                name: stop.landmark.name,
                visited: !!stop.visited_at,
                id: stop.id,
                isTarget: nextUnvisitedStop?.id === stop.id,
                iconType: 'app-poi-marker'
            }))
        );
    }, [itinerary, nextUnvisitedStop]);



    if (isLoading || !itinerary) {
        return (
            <Box className='flex-1 justify-center items-center bg-background-0'>
                <ActivityIndicator size="large" color="#007AFF" />
            </Box>
        );
    }

    const handleFocusStop = (stop: any) => {
        camera.current?.setCamera({
            centerCoordinate: [stop.landmark.longitude, stop.landmark.latitude],
            zoomLevel: 18,
            animationDuration: 800,
            padding: { paddingBottom: SCREEN_HEIGHT * 0.4, paddingTop: 40, paddingLeft: 20, paddingRight: 20 }
        });
    };

    const handleNavigationButtonClick = async () => {
        if (!nextUnvisitedStop) {
            ToastAndroid.show('All stops completed!', ToastAndroid.SHORT);
            return;
        }

        const data = await fetchDirections({
            waypoints: [
                userLocation || [120.8092, 14.8605],
                [nextUnvisitedStop.landmark.longitude, nextUnvisitedStop.landmark.latitude]
            ],
        });
        setNavigationRoute(data.routes);
        setMode(Mode.Navigating);
        setIsSheetOpen(true);

        camera.current?.setCamera({
            centerCoordinate: userLocation || [120.8092, 14.8605],
            zoomLevel: 19,
            pitch: 60,
            heading: data.routes[0].legs[0].steps[0].maneuver.bearing_after,
            animationDuration: 1000
        });
    };

    const handleOptimizePress = async () => {
        const onGoingStops = itinerary.stops.filter(stop => !stop.visited_at);
        const distanceMatrix = await fetchDistanceMatrix({
            waypoints: onGoingStops.map(v => [v.landmark.longitude, v.landmark.latitude])
        })

        const landmarkDistanceMap: Record<string, Record<string, number>> = {};

        onGoingStops.forEach((sourceStop, i) => {
            const sourceId = sourceStop.id;
            landmarkDistanceMap[sourceId] = {};

            onGoingStops.forEach((targetStop, j) => {
                const targetId = targetStop.id;
                landmarkDistanceMap[sourceId][targetId] = distanceMatrix[i][j];
            });
        });

        const optimizedItinerary = await AlgorithmModule.calculateOptimizedItinerary(landmarkDistanceMap)
        const updates = optimizedItinerary.map((id, index) => {
            return supabase.from('poi').update({
                visit_order: index,
            }).eq('id', Number.parseInt(id))
        })
        await Promise.allSettled(updates)

        console.log(optimizedItinerary)

        refetch()
    }

    const handleVisitedPress = async (poi: POI) => {
        try {
            const { error } = await supabase
                .from('poi')
                .update({ visited_at: poi.visited_at ? null : new Date().toISOString() })
                .eq('id', poi.id);
            if (!error) refetch();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <VStack className='flex-1'>
            <MapView
                style={styles.map}
                logoEnabled={false}
                attributionEnabled={false}
                onPress={() => setIsSheetOpen(false)}
            >
                <Camera
                    ref={camera}
                    followUserLocation={mode === Mode.Navigating}
                    defaultSettings={{
                        centerCoordinate: [itinerary.stops[0].landmark.longitude, itinerary.stops[0].landmark.latitude],
                        zoomLevel: 14
                    }}
                />

                <LocationPuck pulsing={{ isEnabled: true, color: '#007AFF' }} />

                {navigationRoute.length > 0 && (
                    <ShapeSource id="routeSource" shape={navigationRoute[0].geometry}>
                        <LineLayer
                            id="routeLayer"
                            style={{
                                lineColor: mode === Mode.Navigating ? '#007AFF' : '#94a3b8',
                                lineWidth: 5,
                                lineCap: 'round',
                                lineJoin: 'round'
                            }}
                        />
                    </ShapeSource>
                )}

                <ShapeSource
                    id="poi-source"
                    shape={poiFeatures as any}
                    onPress={(e) => {
                        const stop = itinerary.stops.find(s => s.id === e.features[0].id);
                        if (stop) {
                            handleFocusStop(stop);
                            setIsSheetOpen(true);
                        }
                    }}
                >
                    <SymbolLayer
                        id="poi-symbols"
                        filter={['==', ['get', 'iconType'], 'app-poi-marker']}
                        style={{
                            iconImage: 'customIcon',
                            iconAllowOverlap: true,
                            iconSize: ['case', ['get', 'isTarget'], 0.6, 0.4],
                            textField: ['get', 'name'],
                            textSize: 11,
                            textAnchor: 'top',
                            textOffset: [0, 1.2],
                            textHaloColor: '#ffffff',
                            textHaloWidth: 1,
                            iconOpacity: ['case', ['get', 'visited'], 0.3, 1]
                        }}
                    />
                    <Images images={{ customIcon: poiIcon }} />
                </ShapeSource>
            </MapView>

            <Box className='absolute top-12 left-4 z-[10]'>
                <Pressable onPress={() => router.back()} className='bg-white p-3 rounded-full shadow-lg'>
                    <Icon as={ChevronLeft} size='xl' className='text-typography-900' />
                </Pressable>
            </Box>

            <CustomLocalSheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)}>
                <ScrollView showsVerticalScrollIndicator={false} className="w-full">
                    {mode === Mode.Viewing ? (
                        <VStack space='lg' className='pb-6'>
                            <HStack className='justify-between items-center'>
                                <VStack>
                                    <Heading size='xl'>{itinerary.name}</Heading>
                                    <HStack space='sm' className='items-center'>
                                        <Icon as={Clock} size='xs' className='text-typography-400' />
                                        <Text size='sm' className='text-typography-500'>
                                            {itinerary.stops.length} Stops • {itinerary.stops.filter(s => !s.visited_at).length} Remaining
                                        </Text>
                                    </HStack>
                                </VStack>
                                <Pressable onPress={() => ToastAndroid.show('Feature coming soon', 2000)}>
                                    <Icon as={PlusCircle} size='xl' className='text-primary-600' />
                                </Pressable>
                            </HStack>

                            <Divider />

                            <FlatList
                                data={itinerary.stops}
                                scrollEnabled={false}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={({ item, index }) => (
                                    <Pressable className='py-4 border-b border-outline-50' onPress={() => handleFocusStop(item)}>
                                        <HStack className='items-center justify-between'>
                                            <HStack space='md' className='flex-1 items-center'>
                                                <Box className={`w-8 h-8 rounded-full items-center justify-center ${item.visited_at ? 'bg-success-500' : 'bg-background-100'}`}>
                                                    {item.visited_at ? <Icon as={Check} size="xs" className="text-white" /> : <Text size='xs' className='font-bold'>{index + 1}</Text>}
                                                </Box>
                                                <VStack>
                                                    <Text className={`font-semibold ${item.visited_at ? 'text-typography-300 line-through' : ''}`}>
                                                        {item.landmark.name}
                                                    </Text>
                                                    <Text size="xs" className="text-typography-400">{item.landmark.municipality}</Text>
                                                </VStack>
                                            </HStack>
                                            <HStack space='sm'>
                                                <Button variant='link' onPress={() => handleVisitedPress(item)}>
                                                    <ButtonIcon as={item.visited_at ? CheckCircle : CheckCircle} className={item.visited_at ? 'text-success-500' : 'text-typography-300'} />
                                                </Button>
                                            </HStack>
                                        </HStack>
                                    </Pressable>
                                )}
                            />
                        </VStack>
                    ) : (
                        <VStack space='md' className='pb-6'>
                            <VStack className="bg-primary-50 p-4 rounded-2xl border border-primary-100">
                                <Text size="xs" className="uppercase font-bold text-primary-600">Heading To</Text>
                                <Heading size='md'>{nextUnvisitedStop?.landmark.name}</Heading>
                                <Text className='font-bold text-primary-700'>{navigationRoute[0]?.distance.toFixed(0)}m remaining</Text>
                            </VStack>
                            <Divider />
                            <VStack space='xs'>
                                {navigationRoute[0]?.legs[0]?.steps.map((step, i) => (
                                    <HStack key={i} space="md" className='bg-background-50 p-3 rounded-xl items-center'>
                                        <Box className="bg-white p-2 rounded-full shadow-sm"><Icon as={Navigation2} size="xs" className="text-primary-500" /></Box>
                                        <Text size='sm' className="flex-1">{step.maneuver.instruction}</Text>
                                    </HStack>
                                ))}
                            </VStack>
                            <Button action='negative' variant='outline' className='rounded-xl mt-4' onPress={() => setMode(Mode.Viewing)}>
                                <ButtonText>Cancel Navigation</ButtonText>
                            </Button>
                        </VStack>
                    )}
                </ScrollView>
            </CustomLocalSheet>

            {/* Floating FABs */}
            <VStack
                space='md'
                className='absolute bottom-6 right-4 z-[5] items-end left-4'
                style={{ marginBottom: isSheetOpen ? 100 : 0 }}
            >
                {!isSheetOpen && (
                    <Button className='rounded-full w-14 h-14 shadow-lg' onPress={() => setIsSheetOpen(true)}>
                        <ButtonIcon as={ArrowUp} size='lg' />
                    </Button>
                )}
                <Button className='rounded-full w-14 h-14 shadow-lg bg-white' onPress={() => {
                    if (userLocation) camera.current?.setCamera({ centerCoordinate: userLocation, zoomLevel: 18, animationDuration: 400 })
                }}>
                    <ButtonIcon as={LocateFixed} className='text-primary-600' size='lg' />
                </Button>

                {mode === Mode.Viewing && (
                    <HStack space='md' className='w-full justify-center pr-4 bg-red-500'>
                        <Button action='secondary' className='rounded-2xl shadow-md h-14 flex-1'
                            onPress={handleOptimizePress}
                        >
                            <ButtonIcon as={ArrowDownUp} className='mr-2' />
                            <ButtonText>Optimize</ButtonText>
                        </Button>
                        <Button
                            className='rounded-2xl shadow-md h-14 flex-1'
                            onPress={handleNavigationButtonClick}
                            isDisabled={!nextUnvisitedStop}
                        >
                            <ButtonIcon as={Navigation} className='mr-2' />
                            <ButtonText>Navigate Now</ButtonText>
                        </Button>
                    </HStack>
                )}
            </VStack>
        </VStack>
    );
}

const styles = StyleSheet.create({ map: { flex: 1 } });