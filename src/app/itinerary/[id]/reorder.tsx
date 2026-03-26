import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Check, Clock, GripVertical } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import DraggableFlatList, {
    DragEndParams,
    RenderItemParams,
    ScaleDecorator
} from 'react-native-draggable-flatlist';

// UI Components
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Modal, ModalBackdrop, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@/components/ui/modal';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import Animated, { LinearTransition, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

// Custom Components & Logic
import { Button, ButtonText } from '@/components/ui/button';
import { Center } from '@/components/ui/center';
import { Heading } from '@/components/ui/heading';
import LoadingModal from '@/src/components/LoadingModal';
import { QueryKey } from '@/src/constants/QueryKey';
import { useToastNotification } from '@/src/hooks/useToastNotification';
import { useUserLocation } from '@/src/hooks/useUserLocation';
import { Place } from '@/src/model/places.types';
import { StopWithPlace } from '@/src/model/stops.types';
import { useAuthStore } from '@/src/stores/useAuth';
import { calculateDistanceMatrix } from '@/src/utils/distance/calculateDistanceMatrix';
import { calculateRouteDistanceFromMatrix } from '@/src/utils/distance/calculateRouteDistanceFromMatrix';
import { fetchDistanceMatrix } from '@/src/utils/distance/fetchDistanceMatrix';
import { getHaversineDistance } from '@/src/utils/distance/getHaversineDistance';
import { fetchItineraryById } from '@/src/utils/fetchItineraries';
import { formatDistance } from '@/src/utils/format/distance';
import { optimizeItinerary } from '@/src/utils/itinerary/optimizeItinerary';
import { supabase } from '@/src/utils/supabase';
import { Pressable } from 'react-native-gesture-handler';


enum LoadingMode {
    Hidden,
    Updating,
    Optimizing,
    Fetching,
    Saving,
}

const ReorderScreen = () => {
    const { id } = useLocalSearchParams();
    const { session } = useAuthStore();
    const userId = session?.user.id;
    const { showToast } = useToastNotification();
    const { userLocation } = useUserLocation();

    const [queryProgress] = useState(0)

    const [loadingModalMode, setLoadingModalMode] = useState(LoadingMode.Hidden);
    const [resultModalData, setResultModalData] = useState<{
        originalStops: StopWithPlace[];
        optimizedIds: string[];
        originalDistance: number;
    } | null>(null);

    const { data: itinerary, isLoading, refetch, } = useQuery({
        queryKey: [QueryKey.ITINERARY_BY_ID, id],
        enabled: !!userId && !!id,
        queryFn: () => fetchItineraryById(userId!, Number.parseInt(id.toString()))
    });

    // Calculate distance to the very next stop visually
    const [distanceToNextStop, setDistanceToNextStop] = useState(0);

    const firstPendingStopId = itinerary?.stops.find(stop => !stop.visited_at)?.place_id;

    React.useEffect(() => {
        const firstStop = itinerary?.stops.find(stop => !stop.visited_at);
        if (userLocation && firstStop?.place) {
            const dist = getHaversineDistance(
                userLocation,
                [firstStop.place.longitude, firstStop.place.latitude]
            );
            setDistanceToNextStop(dist);
        } else {
            setDistanceToNextStop(0);
        }
    }, [userLocation, firstPendingStopId, itinerary?.stops]);


    const handleDragEnd = async ({ data: reorderedPending, from, to }: DragEndParams<StopWithPlace>) => {
        if (!itinerary || from === to) return;

        setLoadingModalMode(LoadingMode.Updating);
        try {
            const fullNewList = [...reorderedPending];

            const updates = fullNewList.map((item, index) => ({
                id: item.id,
                itinerary_id: item.itinerary_id,
                place_id: item.place_id,
                visit_order: index + 1,
                visited_at: item.visited_at
            }));
            const newDistance = await calculateRouteDistanceFromMatrix(fullNewList.map(v => v.place_id));
            const itineraryUpdate = supabase.from('itinerary')
                .update({ distance: newDistance })
                .eq('id', itinerary.id);
            const poiUpdate = supabase.from('stops').upsert(updates);
            const [{ error: itineraryError }, { error: poiError }] = await Promise.all([itineraryUpdate, poiUpdate]);
            if (itineraryError)
                throw itineraryError;
            if (poiError)
                throw poiError;


            await refetch()
            showToast({
                title: "Order Updated",
                description: "Sequence saved successfully.",
                action: "success"
            })
        } catch (error) {
            showToast({
                title: "Error",
                description: (error as any)?.message ?? "Something went wrong.",
                action: "error"
            })
            console.error(error);
        } finally {
            setLoadingModalMode(LoadingMode.Hidden);
        }
    };

    const renderItem = useCallback(({ item, drag, isActive, getIndex }: RenderItemParams<StopWithPlace>) => {
        const currentIndex = getIndex() ?? 0;
        const completedCount = itinerary?.stops.filter(s => !!s.visited_at).length ?? 0;
        const displayNumber = currentIndex + completedCount + 1;

        return (
            <ScaleDecorator>
                <Pressable
                    delayLongPress={500}
                    onLongPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        drag();
                    }}
                    disabled={isActive}
                >
                    <HStack space="md" className={`items-center px-4 py-2 ${isActive ? 'bg-background-200 border border-outline-50' : ''}`}>
                        <Icon as={GripVertical} className="text-typography-300" />
                        <Box className="flex-1">
                            <ReorderListItem
                                displayNumber={displayNumber}
                                isVisited={false}
                                landmark={item.place}
                            />
                        </Box>
                    </HStack>
                </Pressable>
            </ScaleDecorator>
        );
    }, [itinerary]);

    const pendingStops = useMemo(() => itinerary?.stops.filter(stop => !stop.visited_at) ?? [], [itinerary]);
    const completedStops = useMemo(() => itinerary?.stops.filter(stop => !!stop.visited_at) ?? [], [itinerary]);

    const totalDistanceWithUser = useMemo(() => (itinerary?.distance ?? 0) + distanceToNextStop, [itinerary, distanceToNextStop]);

    const HeaderComponent = useCallback(() => (
        <VStack space='md' >
            <VStack>
                <Heading className='text-center'>{itinerary?.name}</Heading>
                <HStack space='sm' className='items-center justify-center'>
                    <Icon as={Clock} size='xs' className='text-typography-400' />
                    <Text size='sm' className='text-typography-500'>
                        {itinerary?.stops.length} Stops • {pendingStops.length} Pending
                    </Text>
                </HStack>
                <VStack space='xs' className='items-center'>
                    <Text className='text-typography-400 text-center' size='lg'>
                        Itinerary Distance: {formatDistance(itinerary?.distance ?? 0)}
                    </Text>
                    {distanceToNextStop > 0 && (
                        <Text size='sm' className='text-typography-500 text-center italic'>
                            Est. Route from Location: {formatDistance(totalDistanceWithUser)}
                        </Text>
                    )}
                </VStack>
            </VStack>
            {completedStops.length > 0 && (
                <>
                    <Box className="px-4 py-2 bg-background-50 ">
                        <Text size="xs" className="uppercase font-bold text-typography-400">Completed Stops</Text>
                    </Box>
                    <VStack
                        className='p-4'
                        space='md'
                    >
                        {completedStops.map((stop, idx) => {
                            const displayNumber = idx + 1
                            return (
                                <ReorderListItem
                                    key={stop.id}
                                    displayNumber={displayNumber}
                                    isVisited={true}
                                    landmark={stop.place}
                                />
                            )
                        })}
                    </VStack>
                </>
            )}

            <Box className="p-2 bg-background-50">
                <Text size="xs" className="uppercase font-bold text-typography-400">Drag to Reorder Stops</Text>
            </Box>
        </VStack>
    ), [itinerary, distanceToNextStop, pendingStops, completedStops, totalDistanceWithUser]);

    if (isLoading) return <LoadingModal isShown={true} />;
    if (!itinerary) return <View className="flex-1 items-center justify-center"><Text>Itinerary not found</Text></View>;


    const handleOptimizePress = async () => {
        setLoadingModalMode(LoadingMode.Fetching)
        try {
            // 1. Separate visited and unvisited stops
            const visitedStops = itinerary.stops.filter(stop => !!stop.visited_at);
            const onGoingStops = itinerary.stops.filter(stop => !stop.visited_at);

            if (onGoingStops.length === 0) return;

            // 2. Fetch distances only for remaining stops
            const distanceMatrix = await Promise.race([
                fetchDistanceMatrix(
                    onGoingStops.map(v => v.place_id)
                ),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error("Query timed out.")), 15000)
                )
            ]);

            let userDistanceMatrix: Record<string, Record<string, number>> = {};
            if (userLocation) {
                const waypoints = [
                    { id: 'user', coords: userLocation },
                    ...onGoingStops.map(s => ({
                        id: s.place_id.toString(),
                        coords: [s.place.longitude, s.place.latitude] as [number, number]
                    }))
                ];
                try {
                    userDistanceMatrix = await calculateDistanceMatrix({ waypointsWithIds: waypoints });
                } catch (e) {
                    console.warn("Failed to calculate user distance matrix:", e);
                }
            }

            let startNodeId: string | undefined = undefined;
            if (userLocation && userDistanceMatrix['user'] && onGoingStops.length > 0) {
                let closestLandmarkId = onGoingStops[0].place_id.toString();
                let minDistanceToUser = Number.MAX_VALUE;

                for (const stop of onGoingStops) {
                    const idStr = stop.place_id.toString();
                    const stopDist = userDistanceMatrix['user'][idStr];
                    if (stopDist !== undefined && stopDist < minDistanceToUser) {
                        minDistanceToUser = stopDist;
                        closestLandmarkId = idStr;
                    }
                }
                startNodeId = closestLandmarkId;
            }

            // 3. Get the optimized order (returns array of IDs)
            setLoadingModalMode(LoadingMode.Optimizing)
            let { distance, optimizedIds, failed } = await optimizeItinerary({
                distanceMap: distanceMatrix,
                currentRouteIds: onGoingStops.map(s => s.place_id.toString()),
                startNodeId
            })

            if (failed) {
                showToast({
                    title: "Already optimized",
                    description: "The itinerary is already optimized and could not be optimized further.",
                    action: "info"
                })
                return;
            }

            // Calculate sequence path distance to be consistent with drag-and-drop
            distance = await calculateRouteDistanceFromMatrix(optimizedIds.map(Number));

            /** * 4. Calculate the starting Index.
             * If 3 stops were already visited (indices 0, 1, 2), 
             * the next optimized stop should be index 3.
             */
            const maxVisitedOrder = visitedStops.length > 0
                ? Math.max(...visitedStops.map(s => s.visit_order ?? 0))
                : -1;
            const startIndex = maxVisitedOrder + 1;

            setLoadingModalMode(LoadingMode.Saving)

            optimizedIds.forEach(async (id, index) => {
                const stopId = onGoingStops.find(v => v.place_id === Number(id))!.id;
                const { error } = await supabase
                    .from('stops')
                    .update({
                        visit_order: startIndex + index,
                    })
                    .eq('id', stopId);
                if (error)
                    throw error;
            });

            const { error } = await supabase
                .from('itinerary')
                .update({ distance: distance })
                .eq('id', itinerary.id)

            if (error)
                throw error;

            await refetch();

            // Show the modal to animate the list change
            setResultModalData({
                originalStops: onGoingStops,
                optimizedIds,
                originalDistance: itinerary.distance,
            });

        } catch (e: any) {
            showToast({
                title: "Optimization Failed",
                description: e.message ?? "Could not optimize",
                action: "error"
            })
            console.error(e)
        } finally {
            setLoadingModalMode(LoadingMode.Hidden)
        }
    };

    function getLoadingModalText() {
        switch (loadingModalMode) {
            case LoadingMode.Hidden:
                return "";
            case LoadingMode.Optimizing:
                return 'Optimizing...';
            case LoadingMode.Updating:
                return 'Updating...';
            case LoadingMode.Fetching:
                return `Fetching (${queryProgress}%)`;
            case LoadingMode.Saving:
                return 'Saving...';
            default:
                return "";
        }
    }


    return (
        <>
            <Stack.Screen options={{ title: "Reorder Stops" }} />
            <LoadingModal isShown={loadingModalMode !== LoadingMode.Hidden}
                loadingText={getLoadingModalText()}
            />
            <DraggableFlatList
                data={pendingStops}
                onDragEnd={handleDragEnd}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerClassName='px-4 pt-4 pb-32'
                ListHeaderComponent={HeaderComponent}
            />
            <Center className='absolute bottom-safe-or-6 left-4 right-4 p-4'>
                <Button className='w-full'
                    onPress={handleOptimizePress}
                    isDisabled={pendingStops.length < 2}
                >
                    <ButtonText>Optimize</ButtonText>
                </Button>
            </Center>

            {resultModalData && (
                <OptimizationResultModal
                    isOpen={!!resultModalData}
                    onClose={() => setResultModalData(null)}
                    originalStops={resultModalData.originalStops}
                    optimizedIds={resultModalData.optimizedIds}
                    optimizedDistance={itinerary.distance}
                    originalDistance={resultModalData.originalDistance}
                />
            )}
        </>
    );
};

export default ReorderScreen;


function ReorderListItem({
    displayNumber,
    isVisited,
    landmark,
}: { landmark: Place, isVisited: boolean, displayNumber: number }) {
    const isPersonal = landmark.creation_type === "PERSONAL"
    return (
        <HStack space='md' className='flex-1 items-center min-w-0 justify-center'>
            <Box className={`w-8 h-8 rounded-full items-center justify-center ${isVisited ? 'bg-success-500' : 'bg-background-100'}`}>
                {isVisited ? (
                    <Icon as={Check} size="xs" />
                ) : (
                    <Text size='xs' className='font-bold text-typography-900'>
                        {displayNumber}
                    </Text>
                )}
            </Box>

            <VStack className='flex-1 '>
                <Text
                    className={`font-semibold ${isVisited ? 'text-typography-300 line-through' : 'text-typography-900'}`}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {landmark.name}
                </Text>
                <Text
                    size="xs"
                    className="text-typography-400"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {isPersonal ? "Custom" : landmark.municipality}
                </Text>
            </VStack>
        </HStack>
    )
}

function OptimizationResultModal({
    isOpen,
    onClose,
    originalStops,
    optimizedIds,
    optimizedDistance,
    originalDistance,
}: {
    isOpen: boolean;
    onClose: () => void;
    originalStops: StopWithPlace[];
    optimizedIds: string[];
    optimizedDistance: number;
    originalDistance: number;
}) {
    const [stops, setStops] = useState(originalStops);
    const distanceProgress = useSharedValue(0);
    const savedScale = useSharedValue(1);

    React.useEffect(() => {
        if (isOpen) {
            distanceProgress.value = 0;
            savedScale.value = 1;
            setStops(originalStops);
            // After a short delay, animate list reorder + distance change together
            const timer = setTimeout(() => {
                const newOrder = [...originalStops].sort((a, b) => {
                    const indexA = optimizedIds.indexOf(a.place_id.toString());
                    const indexB = optimizedIds.indexOf(b.place_id.toString());
                    return indexA - indexB;
                });
                setStops(newOrder);
                distanceProgress.value = withTiming(1, { duration: 1000 });
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [isOpen, originalStops, optimizedIds, distanceProgress, savedScale]);

    // Animate distance value between original and optimized
    const [displayedDistance, setDisplayedDistance] = React.useState(originalDistance);
    React.useEffect(() => {
        if (!isOpen) return;
        setDisplayedDistance(originalDistance);
        const STEPS = 40;
        const DELAY = 800;
        const DURATION = 1000;
        const stepDuration = DURATION / STEPS;
        let step = 0;
        let countInterval: ReturnType<typeof setInterval>;
        const delayTimer = setTimeout(() => {
            countInterval = setInterval(() => {
                step++;
                const t = step / STEPS;
                const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
                const current = originalDistance + (optimizedDistance - originalDistance) * eased;
                setDisplayedDistance(current);
                if (step >= STEPS) clearInterval(countInterval);
            }, stepDuration);
        }, DELAY);

        return () => {
            clearTimeout(delayTimer);
            clearInterval(countInterval!);
        };
    }, [isOpen, originalDistance, optimizedDistance]);

    const distanceSaved = originalDistance - optimizedDistance;

    // Count up the saved distance; spring-bounce the badge once count finishes
    const [displayedSaved, setDisplayedSaved] = React.useState(0);
    React.useEffect(() => {
        if (!isOpen) return;
        setDisplayedSaved(0);
        const STEPS = 40;
        // Starts after: 800ms list delay + 1000ms count-down duration
        const DELAY = 1800;
        const DURATION = 600;
        const stepDuration = DURATION / STEPS;
        let step = 0;
        let countInterval: ReturnType<typeof setInterval>;
        const delayTimer = setTimeout(() => {
            countInterval = setInterval(() => {
                step++;
                const t = step / STEPS;
                const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
                setDisplayedSaved(distanceSaved * eased);
                if (step >= STEPS) {
                    clearInterval(countInterval);
                    setDisplayedSaved(distanceSaved);
                    // Exactly 2 bounces then stop
                    savedScale.value = withSequence(
                        withTiming(1.2, { duration: 130 }),  // bounce 1 up
                        withTiming(1.0, { duration: 110 }),  // bounce 1 down
                        withTiming(1.08, { duration: 90 }), // bounce 2 up (smaller)
                        withTiming(1.0, { duration: 80 }),  // bounce 2 down — done
                    );
                }
            }, stepDuration);
        }, DELAY);
        return () => {
            clearTimeout(delayTimer);
            clearInterval(countInterval!);
        };
    }, [isOpen, distanceSaved, savedScale]);

    const savedAnimStyle = useAnimatedStyle(() => ({
        transform: [{ scale: savedScale.value }],
    }));

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalBackdrop />
            <ModalContent className='rounded-3xl max-h-[80%]'>
                <ModalHeader>
                    <VStack>
                        <Heading size="lg" className='mb-3'>Optimized Route</Heading>
                        <VStack space='xs'>
                            <Text size='md' className='text-typography-500'>
                                Distance: {formatDistance(displayedDistance)}
                            </Text>
                            {distanceSaved > 0 && (
                                <Animated.View style={savedAnimStyle}>
                                    <Box className='mt-1 px-3 py-1 rounded-full bg-success-100 self-start'>
                                        <Text size='md' className='font-bold text-success-700'>
                                            🎉 Saved {formatDistance(displayedSaved)}
                                        </Text>
                                    </Box>
                                </Animated.View>
                            )}
                        </VStack>
                    </VStack>
                </ModalHeader>
                <ModalBody >
                    <VStack space="sm" className="py-2">
                        {stops.map((stop, index) => (
                            <Animated.View
                                key={stop.id}
                                layout={LinearTransition.duration(1000).damping(16).stiffness(120)}
                            >
                                <HStack space="md" className="items-center bg-background-50 border border-background-100 p-2 rounded-md">
                                    <Box className="w-8 h-8 rounded-full bg-primary-50 items-center justify-center">
                                        <Text size="xs" className="font-bold text-primary-900">{index + 1}</Text>
                                    </Box>
                                    <VStack className="flex-1">
                                        <Text size="sm" className="font-semibold" numberOfLines={1}>{stop.place.name}</Text>
                                    </VStack>
                                </HStack>
                            </Animated.View>
                        ))}
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button onPress={onClose} className='rounded-xl'>
                        <ButtonText>Done</ButtonText>
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}