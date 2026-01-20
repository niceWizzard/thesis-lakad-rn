import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Check, GripVertical } from 'lucide-react-native';
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
import { Toast, ToastDescription, ToastTitle, useToast } from '@/components/ui/toast';
import { VStack } from '@/components/ui/vstack';

// Custom Components & Logic
import LoadingModal from '@/src/components/LoadingModal';
import { Landmark } from '@/src/model/landmark.types';
import { POIWithLandmark } from '@/src/model/poi.types';
import { useAuthStore } from '@/src/stores/useAuth';
import { calculateItineraryDistance } from '@/src/utils/calculateItineraryDistance';
import { fetchItineraryById } from '@/src/utils/fetchItineraries';
import { supabase } from '@/src/utils/supabase';
import { Pressable } from 'react-native-gesture-handler';

const ReorderScreen = () => {
    const { id } = useLocalSearchParams();
    const { session } = useAuthStore();
    const userId = session?.user.id;
    const queryClient = useQueryClient();
    const toast = useToast();

    const [isUpdating, setIsUpdating] = useState(false);

    const { data: itinerary, isLoading } = useQuery({
        queryKey: ['itinerary', id],
        enabled: !!userId && !!id,
        queryFn: () => fetchItineraryById(userId!, Number.parseInt(id.toString()))
    });

    const showToast = (title: string, description?: string, action: "success" | "error" = "success") => {
        toast.show({
            placement: "top",
            render: ({ id: toastId }) => (
                <Toast nativeID={"toast-" + toastId} action={action} className="rounded-2xl shadow-xl mt-12">
                    <VStack space="xs">
                        <ToastTitle className="font-bold">{title}</ToastTitle>
                        {description && <ToastDescription>{description}</ToastDescription>}
                    </VStack>
                </Toast>
            ),
        });
    };

    const handleDragEnd = async ({ data: reorderedPending }: DragEndParams<POIWithLandmark>) => {
        if (!itinerary) return;

        setIsUpdating(true);
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
            const poiUpdate = supabase.from('poi').upsert(updates);
            const [{ error: itineraryError }, { error: poiError }] = await Promise.all([itineraryUpdate, poiUpdate]);
            if (itineraryError)
                throw itineraryError;
            if (poiError)
                throw poiError;


            // Update local cache immediately for snappy UI
            queryClient.setQueryData(['itinerary', id], { ...itinerary, stops: fullNewList });
            showToast("Order Updated", "Sequence saved successfully.");
        } catch (error) {
            showToast("Error", "Failed to sync order.", "error");
            console.error(error);
        } finally {
            setIsUpdating(false);
        }
    };

    const renderItem = useCallback(({ item, drag, isActive, getIndex }: RenderItemParams<POIWithLandmark>) => {
        const currentIndex = getIndex() ?? 0;
        const completedCount = itinerary?.stops.filter(s => !!s.visited_at).length ?? 0;
        const displayNumber = currentIndex + completedCount + 1;

        return (
            <ScaleDecorator>
                <Pressable
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

    const pendingStops = itinerary.stops.filter(stop => !stop.visited_at);
    const completedStops = itinerary.stops.filter(stop => !!stop.visited_at);

    return (
        <>
            <Stack.Screen options={{ title: "Reorder Stops" }} />
            <LoadingModal isShown={isUpdating} loadingText="Saving sequence..." />
            <DraggableFlatList
                data={pendingStops}
                onDragEnd={handleDragEnd}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                ListHeaderComponent={
                    <VStack>
                        {completedStops.length > 0 && (
                            <>
                                <Box className="px-4 py-2 bg-background-50">
                                    <Text size="xs" className="uppercase font-bold text-typography-400">Completed Stops</Text>
                                </Box>
                                <VStack
                                    className='p-4'
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

                        <Box className="px-4 py-2 bg-background-50">
                            <Text size="xs" className="uppercase font-bold text-typography-400">Drag to Reorder Stops</Text>
                        </Box>
                    </VStack>
                }
            />
        </>
    );
};

export default ReorderScreen;


function ReorderListItem({
    displayNumber,
    isVisited,
    landmark,
}: { landmark: Landmark, isVisited: boolean, displayNumber: number }) {
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
                    {landmark.municipality}
                </Text>
            </VStack>
        </HStack>
    )
}