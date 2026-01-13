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
import { ActivityIndicator, Dimensions, Pressable, StyleSheet, ToastAndroid } from 'react-native';
import DraggableFlatList, { DragEndParams, RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';

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
import { POI, POIWithLandmark } from '@/src/model/poi.types';
import { useAuthStore } from '@/src/stores/useAuth';
import { fetchDirections, MapboxRoute } from '@/src/utils/fetchDirections';
import { fetchItineraryById } from '@/src/utils/fetchItineraries';
import { supabase } from '@/src/utils/supabase';

// Icons
import { Modal, ModalBackdrop, ModalContent } from '@/components/ui/modal';
import { Spinner } from '@/components/ui/spinner';
import AlgorithmModule from '@/modules/algorithm-module/src/AlgorithmModule';
import { fetchDistanceMatrix } from '@/src/utils/fetchDistanceMatrix';
import {
    ArrowDownUp,
    ArrowUp,
    ArrowUpLeft,
    ArrowUpRight,
    Check,
    CheckCircle,
    Clock,
    GripVertical,
    LocateFixed,
    MapPin,
    Navigation,
    Navigation2,
    PlusCircle,
    RotateCcw
} from 'lucide-react-native';

const poiIcon = require('@/assets/images/red_marker.png');
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

enum Mode {
    Viewing,
    Navigating,
}

const getStepIcon = (instruction: string) => {
    const text = instruction.toLowerCase();
    if (text.includes('left')) return ArrowUpLeft;
    if (text.includes('right')) return ArrowUpRight;
    if (text.includes('u-turn')) return RotateCcw;
    if (text.includes('destination') || text.includes('arrive')) return MapPin;
    return ArrowUp; // Default to straight
};

export default function ItineraryView() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const camera = useRef<Camera>(null);

    const [mode, setMode] = useState<Mode>(Mode.Viewing);
    const [isSheetOpen, setIsSheetOpen] = useState(true);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [navigationRoute, setNavigationRoute] = useState<MapboxRoute[]>([]);
    const [isUpdating, setIsUpdating] = useState(false);

    const { session } = useAuthStore();
    const userId = session?.user.id;

    const { data: itinerary, isLoading, refetch } = useQuery({
        queryKey: ['itinerary', id],
        enabled: !!userId && !!id,
        queryFn: async () => fetchItineraryById(userId!, Number.parseInt(id.toString()))
    });

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

    const handleFocusStop = (stop: any) => {
        camera.current?.setCamera({
            centerCoordinate: [stop.landmark.longitude, stop.landmark.latitude],
            zoomLevel: 18,
            animationDuration: 800,
            padding: { paddingBottom: SCREEN_HEIGHT * 0.4, paddingTop: 40, paddingLeft: 20, paddingRight: 20 }
        });
    };

    const handleDragEnd = async ({ data }: DragEndParams<POIWithLandmark>) => {
        setIsUpdating(true); // Start loading
        try {
            const visited = data.filter(item => !!item.visited_at);
            const unvisited = data.filter(item => !item.visited_at);
            const strictOrder = [...visited, ...unvisited];

            const updates = strictOrder.map((item, index) => ({
                id: item.id,
                itinerary_id: item.itinerary_id,
                landmark_id: item.landmark_id,
                visit_order: index + 1,
                visited_at: item.visited_at
            }));

            const { error } = await supabase.from('poi').upsert(updates, { onConflict: 'id' });
            if (error) throw error;

            await refetch();
        } catch (error) {
            console.error("Reorder Error:", error);
            ToastAndroid.show('Failed to update order', ToastAndroid.SHORT);
        } finally {
            setIsUpdating(false); // Stop loading
        }
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
            zoomLevel: 18,
            pitch: 55, // 3D perspective
            heading: data.routes[0].legs[0].steps[0].maneuver.bearing_after,
            animationDuration: 1500,
        });
    };

    const handleVisitedPress = async (poi: POI) => {
        setIsUpdating(true); // Start loading
        try {
            const isMarkingAsVisited = !poi.visited_at;
            const newVisitedAt = isMarkingAsVisited ? new Date().toISOString() : null;

            const { error: updateError } = await supabase
                .from('poi')
                .update({ visited_at: newVisitedAt })
                .eq('id', poi.id);

            if (updateError) throw updateError;

            const { data: allPois, error: fetchError } = await supabase
                .from('poi')
                .select('*')
                .eq('itinerary_id', poi.itinerary_id);

            if (fetchError || !allPois) throw fetchError || new Error("No data");

            const sortedPois = [...allPois].sort((a, b) => {
                if (a.visited_at && !b.visited_at) return -1;
                if (!a.visited_at && b.visited_at) return 1;
                if (a.visited_at && b.visited_at) {
                    return new Date(a.visited_at).getTime() - new Date(b.visited_at).getTime();
                }
                return (a.visit_order ?? 0) - (b.visit_order ?? 0);
            });

            const updates = sortedPois.map((item, index) => ({
                id: item.id,
                itinerary_id: item.itinerary_id,
                landmark_id: item.landmark_id,
                visit_order: index + 1,
                visited_at: item.visited_at
            }));

            const { error: bulkError } = await supabase
                .from('poi')
                .upsert(updates, { onConflict: 'id' });

            if (bulkError) throw bulkError;

            await refetch();
        } catch (e: any) {
            console.error("Error updating status:", e.message);
        } finally {
            setIsUpdating(false); // Stop loading
        }
    };



    if (isLoading || !itinerary) {
        return (
            <Box className='flex-1 justify-center items-center bg-background-0'>
                <ActivityIndicator size="large" color="#007AFF" />
            </Box>
        );
    }

    const handleOptimizePress = async () => {
        setIsUpdating(true)
        try {
            // 1. Separate visited and unvisited stops
            const visitedStops = itinerary.stops.filter(stop => !!stop.visited_at);
            const onGoingStops = itinerary.stops.filter(stop => !stop.visited_at);

            if (onGoingStops.length === 0) return;

            // 2. Fetch distances only for remaining stops
            const distanceMatrix = await fetchDistanceMatrix({
                waypoints: onGoingStops.map(v => [v.landmark.longitude, v.landmark.latitude])
            });

            const landmarkDistanceMap: Record<string, Record<string, number>> = {};
            onGoingStops.forEach((sourceStop, i) => {
                const sourceId = sourceStop.id;
                landmarkDistanceMap[sourceId] = {};
                onGoingStops.forEach((targetStop, j) => {
                    const targetId = targetStop.id;
                    landmarkDistanceMap[sourceId][targetId] = distanceMatrix[i][j];
                });
            });

            // 3. Get the optimized order (returns array of IDs)
            const optimizedIds = await AlgorithmModule.calculateOptimizedItinerary(landmarkDistanceMap);

            /** * 4. Calculate the starting Index.
             * If 3 stops were already visited (indices 0, 1, 2), 
             * the next optimized stop should be index 3.
             */
            const maxVisitedOrder = visitedStops.length > 0
                ? Math.max(...visitedStops.map(s => s.visit_order ?? 0))
                : -1;
            const startIndex = maxVisitedOrder + 1;

            const updates = optimizedIds.map((id, index) => {
                return supabase
                    .from('poi')
                    .update({
                        visit_order: startIndex + index,
                    })
                    .eq('id', Number.parseInt(id));
            });

            await Promise.allSettled(updates);
            refetch();
            setIsSheetOpen(true)

        } catch (e: any) {
            console.error(e)

        } finally {
            setIsUpdating(false)
        }
    };

    // 1. Get the actual count of completed (visited) stops
    const completedStops = itinerary.stops.filter(stop => !!stop.visited_at);

    // 2. Get the list of stops that are still pending (to be used in the draggable list)
    const pendingStops = itinerary.stops.filter(stop => !stop.visited_at);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
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
                    <ShapeSource id="poi-source" shape={poiFeatures as any}>
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

                <CustomLocalSheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)}>
                    {mode === Mode.Viewing ? (
                        <VStack space='lg' className='pb-6 h-full'>
                            <HStack className='justify-between items-center px-4'>
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

                            <DraggableFlatList
                                data={pendingStops}
                                keyExtractor={(item) => item.id.toString()}
                                onDragEnd={handleDragEnd}
                                contentContainerStyle={{ paddingBottom: 100 }}
                                ListHeaderComponent={
                                    <VStack>
                                        {completedStops
                                            .sort((a, b) => new Date(a.visited_at!).getTime() - new Date(b.visited_at!).getTime())
                                            .map((item) => (
                                                <Box key={item.id} className="px-4 py-4 border-b border-outline-50 bg-background-50 opacity-70">
                                                    <HStack className='items-center justify-between'>
                                                        <HStack space='md' className='flex-1 items-center min-w-0'>
                                                            <Box className="w-6" />
                                                            <Box className="w-8 h-8 rounded-full bg-success-500 items-center justify-center">
                                                                <Icon as={Check} size="xs" />
                                                            </Box>
                                                            <VStack className='flex-1 min-w-0'>
                                                                <Text
                                                                    className="font-semibold text-typography-400 line-through"
                                                                    numberOfLines={1}
                                                                    ellipsizeMode="tail"
                                                                >
                                                                    {item.landmark.name}
                                                                </Text>
                                                                <Text
                                                                    size="xs"
                                                                    className="text-typography-400"
                                                                    numberOfLines={1}
                                                                    ellipsizeMode="tail"
                                                                >
                                                                    {item.landmark.municipality}
                                                                </Text>
                                                            </VStack>
                                                        </HStack>
                                                        <Button variant='link' onPress={() => handleVisitedPress(item)}>
                                                            <ButtonIcon as={CheckCircle} className='text-success-500' />
                                                        </Button>
                                                    </HStack>
                                                </Box>
                                            ))}
                                    </VStack>
                                }
                                renderItem={({ item, drag, isActive, getIndex }: RenderItemParams<POIWithLandmark>) => {
                                    const isVisited = !!item.visited_at;
                                    const currentIndex = getIndex() ?? 0;
                                    const displayNumber = currentIndex + completedStops.length + 1;
                                    return (
                                        <ScaleDecorator>
                                            <Pressable
                                                onPress={() => handleFocusStop(item)}
                                                onLongPress={() => {
                                                    if (!isVisited) {
                                                        drag();
                                                    } else {
                                                        ToastAndroid.show("Visited stops cannot be reordered", ToastAndroid.SHORT);
                                                    }
                                                }}
                                                disabled={isActive && !item.visited_at}
                                                className={`px-4 py-4 border-b border-outline-50 `}
                                            >
                                                <HStack className='items-center justify-between'>
                                                    <HStack space='md' className='flex-1 items-center min-w-0'>
                                                        <Box className="mr-1">
                                                            {!isVisited ? (
                                                                <Icon as={GripVertical} size="sm" className="text-typography-300" />
                                                            ) : (
                                                                <Box className="w-4" />
                                                            )}
                                                        </Box>

                                                        <Box className={`w-8 h-8 rounded-full items-center justify-center ${isVisited ? 'bg-success-500' : 'bg-background-100'}`}>
                                                            {isVisited ? (
                                                                <Icon as={Check} size="xs" />
                                                            ) : (
                                                                <Text size='xs' className='font-bold text-typography-900'>
                                                                    {displayNumber}
                                                                </Text>
                                                            )}
                                                        </Box>

                                                        <VStack className='flex-1 min-w-0'>
                                                            <Text
                                                                className={`font-semibold ${isVisited ? 'text-typography-300 line-through' : 'text-typography-900'}`}
                                                                numberOfLines={1}
                                                                ellipsizeMode="tail"
                                                            >
                                                                {item.landmark.name}
                                                            </Text>
                                                            <Text
                                                                size="xs"
                                                                className="text-typography-400"
                                                                numberOfLines={1}
                                                                ellipsizeMode="tail"
                                                            >
                                                                {item.landmark.municipality}
                                                            </Text>
                                                        </VStack>
                                                    </HStack>

                                                    <Button variant='link' onPress={() => handleVisitedPress(item)}>
                                                        <ButtonIcon as={CheckCircle} className={isVisited ? 'text-success-500' : 'text-typography-300'} />
                                                    </Button>
                                                </HStack>
                                            </Pressable>
                                        </ScaleDecorator>
                                    );
                                }}
                            />
                        </VStack>
                    ) : (
                        <VStack className='h-full bg-background-0'>
                            {/* Primary Instruction Card */}
                            <Box className="mx-4 mt-2 p-5 bg-background-100 rounded-3xl shadow-xl">
                                <HStack space="lg" className="items-center">
                                    <Box className="bg-primary-500 p-4 rounded-2xl">
                                        <Icon
                                            as={Navigation2}
                                            size="xl"
                                            style={{ transform: [{ rotate: '45deg' }] }}
                                        />
                                    </Box>
                                    <VStack className="flex-1">
                                        <Text size="sm" className="text-primary-400 font-bold uppercase tracking-wider">
                                            {navigationRoute[0]?.distance > 1000
                                                ? `${(navigationRoute[0]?.distance / 1000).toFixed(1)} km`
                                                : `${navigationRoute[0]?.distance.toFixed(0)} m`}
                                        </Text>
                                        <Heading size='lg' className=" leading-tight">
                                            {navigationRoute[0]?.legs[0]?.steps[0]?.maneuver.instruction}
                                        </Heading>
                                    </VStack>
                                </HStack>
                            </Box>

                            {/* Destination Target */}
                            <HStack className="px-6 py-4 items-center" space="sm">
                                <Icon as={CheckCircle} size="sm" className="text-success-500" />
                                <Text size="sm" className="text-typography-500 font-medium">
                                    Target: <Text size="sm" className="font-bold text-typography-900">{nextUnvisitedStop?.landmark.name}</Text>
                                </Text>
                            </HStack>

                            <Divider className="mx-4" />

                            {/* Upcoming Steps List */}
                            <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-4 mt-2">
                                <Text size="xs" className="px-2 mb-3 uppercase font-bold text-typography-400">Upcoming Steps</Text>
                                <VStack space='sm' className="pb-20">
                                    {navigationRoute[0]?.legs[0]?.steps.slice(1).map((step, i) => (
                                        <HStack key={i} space="md" className='bg-background-50 p-4 rounded-2xl items-center border border-outline-50'>
                                            <Box className="bg-background-300 p-2 rounded-xl shadow-sm border border-outline-100">
                                                {/* You can replace this with a dynamic icon library like Lucide arrow icons */}
                                                <Icon as={getStepIcon(step.maneuver.instruction)} size="xs" className="text-typography-400" />
                                            </Box>
                                            <VStack className="flex-1">
                                                <Text size='md' className="text-typography-800 font-medium">{step.maneuver.instruction}</Text>
                                                <Text size='xs' className="text-typography-400">{step.distance.toFixed(0)} m</Text>
                                            </VStack>
                                        </HStack>
                                    ))}
                                </VStack>
                            </ScrollView>

                            {/* Controls Overlay */}
                            <Box className="absolute bottom-6 left-4 right-4">
                                <Button
                                    action='negative'
                                    variant='solid'
                                    className='rounded-2xl h-14 shadow-lg bg-error-600'
                                    onPress={() => setMode(Mode.Viewing)}
                                >
                                    <ButtonText className="font-bold">Exit Navigation</ButtonText>
                                </Button>
                            </Box>
                        </VStack>
                    )}
                </CustomLocalSheet>

                <VStack space='md' className='absolute bottom-6 right-4 z-[5] items-end left-4' style={{ marginBottom: isSheetOpen ? 120 : 0 }}>
                    {!isSheetOpen && (
                        <Button className='rounded-full w-14 h-14 shadow-lg' onPress={() => setIsSheetOpen(true)}>
                            <ButtonIcon as={ArrowUp} size='lg' />
                        </Button>
                    )}
                    <Button className='rounded-full w-14 h-14 shadow-lg' onPress={() => userLocation && camera.current?.setCamera({ centerCoordinate: userLocation, zoomLevel: 18, animationDuration: 400 })}>
                        <ButtonIcon as={LocateFixed} className='text-primary-600' size='lg' />
                    </Button>
                    {mode === Mode.Viewing && (
                        <HStack space='md' className='w-full justify-center'>
                            <Button action='secondary' className='rounded-2xl shadow-md h-14 flex-1' onPress={handleOptimizePress}>
                                <ButtonIcon as={ArrowDownUp} className='mr-2' />
                                <ButtonText>Optimize</ButtonText>
                            </Button>
                            <Button className='rounded-2xl shadow-md h-14 flex-1' onPress={handleNavigationButtonClick} isDisabled={!nextUnvisitedStop}>
                                <ButtonIcon as={Navigation} className='mr-2' />
                                <ButtonText>Navigate</ButtonText>
                            </Button>
                        </HStack>
                    )}
                </VStack>
                <Modal isOpen={isUpdating} closeOnOverlayClick={false}>
                    <ModalBackdrop />
                    <ModalContent className="p-8 items-center justify-center rounded-2xl w-auto">
                        <VStack space="md" className="items-center">
                            <Spinner size="large" color="primary" />
                            <Text className="font-medium text-typography-700">Updating Itinerary...</Text>
                        </VStack>
                    </ModalContent>
                </Modal>
            </VStack>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({ map: { flex: 1 } });