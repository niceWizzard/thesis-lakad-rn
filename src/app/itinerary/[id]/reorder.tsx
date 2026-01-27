import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Check, Clock, GripVertical } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
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
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

// Custom Components & Logic
import { Button, ButtonText } from '@/components/ui/button';
import { Center } from '@/components/ui/center';
import { Heading } from '@/components/ui/heading';
import AlgorithmModule from '@/modules/algorithm-module/src/AlgorithmModule';
import LoadingModal from '@/src/components/LoadingModal';
import { useToastNotification } from '@/src/hooks/useToastNotification';
import { Landmark } from '@/src/model/landmark.types';
import { StopWithLandmark } from '@/src/model/stops.types';
import { useAuthStore } from '@/src/stores/useAuth';
import { calculateItineraryDistance } from '@/src/utils/calculateItineraryDistance';
import { calculateDistanceMatrix } from '@/src/utils/fetchDistanceMatrix';
import { fetchItineraryById } from '@/src/utils/fetchItineraries';
import { formatDistance } from '@/src/utils/format/distance';
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
    const queryClient = useQueryClient();
    const { showToast } = useToastNotification();

    const [queryProgress, setQueryProgress] = useState(0)

    const [loadingModalMode, setLoadingModalMode] = useState(LoadingMode.Hidden);

    const { data: itinerary, isLoading, refetch, } = useQuery({
        queryKey: ['itinerary', id],
        enabled: !!userId && !!id,
        queryFn: () => fetchItineraryById(userId!, Number.parseInt(id.toString()))
    });


    const handleDragEnd = async ({ data: reorderedPending, from, to }: DragEndParams<StopWithLandmark>) => {
        if (!itinerary || from == to) return;

        setLoadingModalMode(LoadingMode.Updating);
        try {
            const completed = itinerary.stops.filter(s => !!s.visited_at);
            // Construct the full new list: Completed stays first, then reordered pending
            const fullNewList = [...completed, ...reorderedPending];

            const updates = fullNewList.map((item, index) => ({
                id: item.id,
                itinerary_id: item.itinerary_id,
                landmark_id: item.landmark_id,
                visit_order: index + 1,
                visited_at: item.visited_at
            }));
            const newDistance = await calculateItineraryDistance(fullNewList.map(v => [v.landmark.longitude, v.landmark.latitude]));
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
                description: "Failed to sync stop order.",
                action: "error"
            })
            console.error(error);
        } finally {
            setLoadingModalMode(LoadingMode.Hidden);
        }
    };

    const renderItem = useCallback(({ item, drag, isActive, getIndex }: RenderItemParams<StopWithLandmark>) => {
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
                                landmark={item.landmark}
                            />
                        </Box>
                    </HStack>
                </Pressable>
            </ScaleDecorator>
        );
    }, [itinerary]);

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
            const distanceMatrix = await calculateDistanceMatrix({
                waypointsWithIds: onGoingStops.map(v => ({
                    coords: [v.landmark.longitude, v.landmark.latitude],
                    id: v.id.toString(),
                })),
                onFetchProgress(current, total) {
                    setQueryProgress(Math.round((current / total) * 100));
                },
            });

            // 3. Get the optimized order (returns array of IDs)
            setLoadingModalMode(LoadingMode.Optimizing)
            let optimizedIds: string[] = [];
            let distance = 0;
            let bestDistance = Number.MAX_VALUE;
            for (let i = 0; i < 15; i++) {
                const {
                    itinerary: optimizedItinerary,
                    distance: calculatedDistance,
                } = await AlgorithmModule.calculateOptimizedItinerary(distanceMatrix);
                bestDistance = Math.min(bestDistance, calculatedDistance);
                if (calculatedDistance <= itinerary.distance) {
                    optimizedIds = optimizedItinerary;
                    distance = calculatedDistance;
                    break;
                }
                if (i == 14) {
                    throw new Error("Could not optimize any further.")
                }
            }

            /** * 4. Calculate the starting Index.
             * If 3 stops were already visited (indices 0, 1, 2), 
             * the next optimized stop should be index 3.
             */
            const maxVisitedOrder = visitedStops.length > 0
                ? Math.max(...visitedStops.map(s => s.visit_order ?? 0))
                : -1;
            const startIndex = maxVisitedOrder + 1;

            setLoadingModalMode(LoadingMode.Saving)

            const updates = optimizedIds.map((id, index) => {
                return supabase
                    .from('stops')
                    .update({
                        visit_order: startIndex + index,
                    })
                    .eq('id', Number.parseInt(id));
            });

            const itineraryUpdate = supabase
                .from('itinerary')
                .update({ distance: distance })
                .eq('id', itinerary.id)


            await Promise.allSettled([...updates, itineraryUpdate]);
            await refetch();
            showToast({
                title: "Optimization Complete",
                description: "The route has been reordered for efficiency.",
                action: "success"
            })

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
    const pendingStops = itinerary.stops.filter(stop => !stop.visited_at);
    const completedStops = itinerary.stops.filter(stop => !!stop.visited_at);

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
                ListHeaderComponent={
                    <VStack space='md' >
                        <VStack>
                            <Heading className='text-center'>{itinerary.name}</Heading>
                            <HStack space='sm' className='items-center justify-center'>
                                <Icon as={Clock} size='xs' className='text-typography-400' />
                                <Text size='sm' className='text-typography-500'>
                                    {itinerary.stops.length} Stops • {pendingStops.length} Pending
                                </Text>
                            </HStack>
                            <Text className='text-typography-400 text-center'>
                                {formatDistance(itinerary.distance)}
                            </Text>
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
                                                landmark={stop.landmark}
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
                }
            />
            <Center className='absolute bottom-safe-or-6 left-4 right-4 p-4'>
                <Button className='w-full'
                    onPress={handleOptimizePress}
                    isDisabled={pendingStops.length < 2}
                >
                    <ButtonText>Optimize</ButtonText>
                </Button>
            </Center>
        </>
    );
};

export default ReorderScreen;


function ReorderListItem({
    displayNumber,
    isVisited,
    landmark,
}: { landmark: Landmark, isVisited: boolean, displayNumber: number }) {
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