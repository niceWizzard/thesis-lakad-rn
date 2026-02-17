import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
    ArrowDownUp,
    Clock,
    Navigation,
    PlusCircle,
    SquareStack
} from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Mode } from '@/src/hooks/itinerary/useNavigationState';
import { useToastNotification } from '@/src/hooks/useToastNotification';
import { ItineraryWithStops } from '@/src/model/itinerary.types';
import { Stop, StopWithLandmark } from '@/src/model/stops.types';
import { formatDistance } from '@/src/utils/format/distance';
import { formatDuration } from '@/src/utils/format/time';
import { supabase } from '@/src/utils/supabase';
import { toggleStopStatus } from '@/src/utils/toggleStopStatus';
import { updateStopDuration } from '@/src/utils/updateStop';

import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import LoadingModal from '@/src/components/LoadingModal';
import StopListItem from '@/src/components/StopListItem';
import { EditDurationModal } from './EditDurationModal';

interface ViewingModeBottomSheetProps {
    itinerary: ItineraryWithStops;
    mode: Mode;
    isSheetOpen: boolean;
    pendingStops: StopWithLandmark[];
    completedStops: StopWithLandmark[];
    refetch: () => Promise<any>;
    showToast: ReturnType<typeof useToastNotification>['showToast'];
    locatePOI: (longitude: number, latitude: number) => void;
    goNavigationMode: () => void;
    onCardViewOpen: (a: boolean) => void,
    onStopPress: (stop: StopWithLandmark) => void,
}

export function ViewingModeBottomSheet({
    itinerary,
    mode,
    isSheetOpen,
    pendingStops,
    refetch,
    showToast,
    locatePOI,
    goNavigationMode,
    onCardViewOpen,
    onStopPress,
}: ViewingModeBottomSheetProps) {
    const scrollViewRef = useRef<ScrollView>(null);
    const router = useRouter();
    const [isUpdating, setIsUpdating] = useState(false);
    const [editingStop, setEditingStop] = useState<StopWithLandmark | null>(null);
    const queryClient = useQueryClient();

    // Auto-scroll to top when sheet opens
    useEffect(() => {
        if (mode === Mode.Viewing && isSheetOpen) {
            const timer = setTimeout(() => {
                if (!itinerary || !scrollViewRef.current) return;
                const pending = itinerary.stops.filter(stop => !stop.visited_at);
                if (pending.length > 0) {
                    scrollViewRef.current.scrollTo({
                        y: 0,
                        animated: true,
                    });
                }
            }, 300);

            return () => clearTimeout(timer);
        }
    }, [mode, isSheetOpen, itinerary]);

    // Calculate total duration
    const totalDuration = useMemo(() => {
        if (!itinerary) return 0;

        // Calculate travel time: distance (meters) / speed (meters/minute)
        // Assuming 30 km/h = 500 meters/minute
        const travelTimeMinutes = itinerary.distance / 500;

        // Calculate total visit duration
        const visitDuration = itinerary.stops.reduce((acc, stop) => acc + (stop.visit_duration || 0), 0);

        return Math.round(travelTimeMinutes + visitDuration);
    }, [itinerary]);

    const handleAddPoi = async () => {
        router.navigate({
            pathname: '/itinerary/[id]/add-stop',
            params: { id: itinerary.id, currentCount: itinerary.stops.length },
        });
    };

    const handleVisitedPress = async (stop: Stop) => {
        setIsUpdating(true);
        try {
            await toggleStopStatus(stop);
            await refetch();
            queryClient.invalidateQueries({ queryKey: ['itineraries'] });
        } catch (e: any) {
            console.error("Error updating status:", e.message);
            showToast({
                title: "Something went wrong.",
                description: e.message ?? "Some error happened.",
                action: 'error'
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleReorderPress = () => {
        router.navigate({
            pathname: '/itinerary/[id]/reorder',
            params: { id: itinerary.id },
        });
    };

    const handleRemoveStop = async (id: number) => {
        setIsUpdating(true);
        try {
            const { error } = await supabase.from('stops').delete().eq('id', id);
            if (error) throw error;
            await refetch();
        } catch (err: any) {
            showToast({
                title: "Something went wrong.",
                description: err.message ?? "Some error happened.",
                action: 'error'
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleEditDuration = async (duration: number) => {
        if (!editingStop) return;

        setIsUpdating(true);
        try {
            await updateStopDuration(editingStop.id, duration);
            await refetch();
            queryClient.invalidateQueries({ queryKey: ['itineraries'] });
            showToast({
                title: "Duration updated",
                description: `Visit duration for ${editingStop.landmark.name} updated.`,
                action: 'success'
            });
        } catch (e: any) {
            console.error("Error updating duration:", e.message);
            showToast({
                title: "Update failed",
                description: e.message ?? "Could not update duration.",
                action: 'error'
            });
        } finally {
            setIsUpdating(false);
            setEditingStop(null);
        }
    };

    if (mode !== Mode.Viewing) return null;

    return (
        <>
            <LoadingModal
                isShown={isUpdating}
                loadingText={"Updating itinerary"}
            />

            <EditDurationModal
                isOpen={!!editingStop}
                onClose={() => setEditingStop(null)}
                onSave={handleEditDuration}
                initialDuration={editingStop?.visit_duration}
                stopName={editingStop?.landmark.name || ''}
            />

            <VStack space='lg' className='pb-6 h-full flex-1'>
                {/* Drag Indicator */}
                <Box className='w-full items-center pt-2 pb-1'>
                    <Box className='w-12 h-1 bg-outline-300 rounded-full' />
                </Box>

                <HStack className='justify-between items-center px-4'>
                    <VStack className='flex-1'>
                        <Heading size='xl'>{itinerary.name}</Heading>
                        <HStack space='sm' className='items-center'>
                            <Icon as={Clock} size='xs' className='text-typography-400' />
                            <Text size='sm' className='text-typography-500'>
                                {itinerary.stops.length} Stops • {formatDistance(itinerary.distance)} • {formatDuration(totalDuration)}
                            </Text>
                        </HStack>
                    </VStack>
                    <Button
                        variant='link'
                        onPress={handleAddPoi}
                        isDisabled={itinerary.stops.length >= 50}
                    >
                        <ButtonIcon as={PlusCircle} size='xl' className='text-primary-600' />
                        <ButtonText>Add</ButtonText>
                    </Button>
                </HStack>
                <Divider />
                <HStack className='justify-end px-4 gap-4'
                >
                    {
                        itinerary.stops.length > 0 && (
                            <Button action='secondary' className='rounded-2xl shadow-md'
                                onPress={() => onCardViewOpen(true)}
                            >
                                <ButtonIcon as={SquareStack} />
                            </Button>
                        )
                    }
                    <Button action='secondary' className='rounded-2xl shadow-md ' onPress={handleReorderPress}
                        isDisabled={pendingStops.length < 2}
                    >
                        <ButtonIcon as={ArrowDownUp} className='mr-2' />
                        <ButtonText>Reorder</ButtonText>
                    </Button>
                    <Button className='rounded-2xl shadow-md  ' onPress={goNavigationMode} isDisabled={pendingStops.length < 1}>
                        <ButtonIcon as={Navigation} className='mr-2' />
                        <ButtonText>Navigate</ButtonText>
                    </Button>

                </HStack>
                {itinerary.stops.map((item, currentIndex) => {
                    const isVisited = !!item.visited_at;
                    const displayNumber = currentIndex + 1;
                    return (
                        <View
                            className='px-4 py-4 border-b border-outline-50'
                            key={item.id}
                        >
                            <StopListItem
                                displayNumber={displayNumber}
                                isVisited={isVisited}
                                landmark={item.landmark}
                                onVisitToggle={() => handleVisitedPress(item)}
                                onDelete={() => handleRemoveStop(item.id)}
                                onLocate={() => locatePOI(item.landmark.longitude, item.landmark.latitude)}
                                onPress={() => onStopPress(item)}
                                visitDuration={item.visit_duration}
                                onEditDuration={() => setEditingStop(item)}
                            />
                        </View>
                    );
                })}
                {
                    itinerary.stops.length === 0 && (
                        <Text className='text-center text-typography-500'>No stops added yet.</Text>
                    )
                }
            </VStack>
        </>
    );
}

