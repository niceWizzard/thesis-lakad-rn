import { Progress, ProgressFilledTrack } from '@/components/ui/progress';
import useThemeConfig from '@/src/hooks/useThemeConfig';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
    ArrowDownUp,
    ChevronDown,
    ChevronRight,
    Clock,
    Eye,
    ListCheck,
    Navigation,
    PlusCircle,
    Ruler,
    SquareStack
} from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutAnimation, Pressable, ScrollView, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { Mode } from '@/src/hooks/itinerary/useNavigationState';
import { useToastNotification } from '@/src/hooks/useToastNotification';
import { ItineraryWithStops } from '@/src/model/itinerary.types';
import { Stop, StopWithPlace } from '@/src/model/stops.types';
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
import { QueryKey } from '@/src/constants/QueryKey';
import { useAuthStore } from '@/src/stores/useAuth';
import { EditDurationModal } from './EditDurationModal';

interface ViewingModeBottomSheetProps {
    itinerary: ItineraryWithStops;
    mode: Mode;
    isSheetOpen: boolean;
    pendingStops: StopWithPlace[];
    completedStops: StopWithPlace[];
    refetch: () => Promise<any>;
    showToast: ReturnType<typeof useToastNotification>['showToast'];
    locatePOI: (longitude: number, latitude: number) => void;
    goNavigationMode: () => void;
    startVisualization: () => void;
    onCardViewOpen: (a: boolean) => void,
    onShowStopInfo: (stop: StopWithPlace) => void,
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
    startVisualization,
    onCardViewOpen,
    onShowStopInfo,
}: ViewingModeBottomSheetProps) {
    const scrollViewRef = useRef<ScrollView>(null);
    const router = useRouter();
    const [isUpdating, setIsUpdating] = useState(false);
    const [editingStop, setEditingStop] = useState<StopWithPlace | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const queryClient = useQueryClient();
    const { session } = useAuthStore()
    const userId = session?.user.id;
    const theme = useThemeConfig();

    const stats = useMemo(() => {
        if (!itinerary) return { completed: 0, total: 0, percentage: 0 };
        const completed = itinerary.stops.filter(s => !!s.visited_at).length;
        const total = itinerary.stops.length;
        const percentage = total > 0 ? (completed / total) * 100 : 0;
        return { completed, total, percentage };
    }, [itinerary]);

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
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            await toggleStopStatus(stop);
            await refetch();
            await queryClient.invalidateQueries({ queryKey: [QueryKey.ITINERARY_BY_ID, itinerary.id] });
            await queryClient.invalidateQueries({ queryKey: [QueryKey.ITINERARIES, userId] });
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
            await queryClient.invalidateQueries({ queryKey: [QueryKey.ITINERARY_BY_ID, itinerary.id] });
            await queryClient.invalidateQueries({ queryKey: [QueryKey.ITINERARIES, userId] });
            showToast({
                title: "Duration updated",
                description: `Visit duration for ${editingStop.place.name} updated.`,
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
                stopName={editingStop?.place.name || ''}
            />

            <VStack space='lg' className='pb-6 h-full flex-1'>
                {/* Drag Indicator */}
                <Box className='w-full items-center pt-2 pb-1'>
                    <Box className='w-12 h-1 bg-outline-300 rounded-full' />
                </Box>

                <VStack space='md'>
                    <HStack className='justify-between items-center px-4'>
                        <VStack className='flex-1'>
                            <Heading size='xl'>{itinerary.name}</Heading>
                            <Text size='sm' className='text-typography-500 font-medium'>
                                {stats.completed} of {stats.total} landmarks explored
                            </Text>
                        </VStack>
                        <Button
                            size='sm'
                            variant='outline'
                            action='primary'
                            className='rounded-full px-4'
                            onPress={handleAddPoi}
                            isDisabled={itinerary.stops.length >= 50}
                        >
                            <ButtonIcon as={PlusCircle} className='mr-1' />
                            <ButtonText>Stop</ButtonText>
                        </Button>
                    </HStack>

                    <Box className='px-4'>
                        <Progress value={stats.percentage} size='sm' className='bg-background-100'>
                            <ProgressFilledTrack className='bg-primary-600' />
                        </Progress>
                    </Box>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16 }}
                        className='flex-grow-0'
                    >
                        <HStack space='sm'>
                            <Box className='bg-background-50 px-3 py-2 rounded-xl border border-outline-100 flex-row items-center'>
                                <Icon as={Clock} size='sm' className='text-primary-600 mr-2' />
                                <VStack>
                                    <Text size='xs' className='text-typography-400 leading-none'>Duration</Text>
                                    <Text size='sm' className='font-bold text-typography-900'>{formatDuration(totalDuration)}</Text>
                                </VStack>
                            </Box>
                            <Box className='bg-background-50 px-3 py-2 rounded-xl border border-outline-100 flex-row items-center'>
                                <Icon as={Ruler} size='sm' className='text-primary-600 mr-2' />
                                <VStack>
                                    <Text size='xs' className='text-typography-400 leading-none'>Distance</Text>
                                    <Text size='sm' className='font-bold text-typography-900'>{formatDistance(itinerary.distance)}</Text>
                                </VStack>
                            </Box>
                            <Box className='bg-background-50 px-3 py-2 rounded-xl border border-outline-100 flex-row items-center'>
                                <Icon as={ListCheck} size='sm' className='text-primary-600 mr-2' />
                                <VStack>
                                    <Text size='xs' className='text-typography-400 leading-none'>Remaining</Text>
                                    <Text size='sm' className='font-bold text-typography-900'>{itinerary.stops.length - stats.completed} Stops</Text>
                                </VStack>
                            </Box>
                        </HStack>
                    </ScrollView>
                </VStack>
                <Divider />
                <VStack className='px-4 w-full' space="md">
                    <TouchableOpacity
                        className={`flex-row justify-center items-center py-3.5 rounded-2xl bg-primary-600 ${pendingStops.length < 1 ? 'opacity-50' : ''}`}
                        onPress={goNavigationMode}
                        disabled={pendingStops.length < 1}
                        activeOpacity={0.8}
                    >
                        <Icon as={Navigation} className='text-typography-0 mr-2' size="md" />
                        <Text size="md" className='font-bold text-typography-0'>Start Navigation</Text>
                    </TouchableOpacity>

                    {itinerary.stops.length > 0 && (
                        <HStack className='w-full' space="md">
                            <TouchableOpacity
                                className={`flex-1 items-center justify-center py-3.5 rounded-2xl border border-outline-100 bg-background-0 ${pendingStops.length < 1 ? 'opacity-50' : ''}`}
                                onPress={startVisualization}
                                disabled={pendingStops.length < 1}
                                activeOpacity={0.7}
                            >
                                <Icon as={Eye} className='text-typography-800 mb-1.5' size="md" />
                                <Text size="xs" className='font-semibold text-typography-600'>Visualize</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className={`flex-1 items-center justify-center py-3.5 rounded-2xl border border-outline-100 bg-background-0 ${pendingStops.length < 2 ? 'opacity-50' : ''}`}
                                onPress={handleReorderPress}
                                disabled={pendingStops.length < 2}
                                activeOpacity={0.7}
                            >
                                <Icon as={ArrowDownUp} className='text-typography-800 mb-1.5' size="md" />
                                <Text size="xs" className='font-semibold text-typography-600'>Reorder</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className='flex-1 items-center justify-center py-3.5 rounded-2xl border border-outline-100 bg-background-0'
                                onPress={() => onCardViewOpen(true)}
                                activeOpacity={0.7}
                            >
                                <Icon as={SquareStack} className='text-typography-800 mb-1.5' size="md" />
                                <Text size="xs" className='font-semibold text-typography-600'>Cards</Text>
                            </TouchableOpacity>
                        </HStack>
                    )}
                </VStack>


                {/* History Collapsible Section */}
                {stats.completed > 0 && (
                    <VStack className='mt-6 px-4'>
                        <Pressable
                            onPress={() => {
                                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                setShowHistory(!showHistory);
                            }}
                            className='flex-row items-center justify-between py-4 border-b border-outline-50'
                        >
                            <HStack space='sm' className='items-center'>
                                <Heading>Travel History ({stats.completed})</Heading>
                            </HStack>
                            <Icon as={showHistory ? ChevronDown : ChevronRight} size='sm' className='text-typography-400' />
                        </Pressable>

                        {showHistory && (
                            <VStack space='xs' className='mt-2 opacity-60'>
                                {itinerary.stops.filter(s => !!s.visited_at).map((item) => {
                                    const displayNumber = itinerary.stops.indexOf(item) + 1;
                                    return (
                                        <View key={item.id} className='py-1'>
                                            <StopListItem
                                                displayNumber={displayNumber}
                                                isVisited={true}
                                                landmark={item.place}
                                                onVisitToggle={() => handleVisitedPress(item)}
                                                onDelete={() => handleRemoveStop(item.id)}
                                                onLocate={() => locatePOI(item.place.longitude, item.place.latitude)}
                                                onShowStopInfo={() => onShowStopInfo(item)}
                                                visitDuration={item.visit_duration}
                                                onEditDuration={() => setEditingStop(item)}
                                            />
                                        </View>
                                    );
                                })}
                            </VStack>
                        )}
                    </VStack>
                )}
                <VStack className='flex-1 pb-10'>
                    <Heading className=' ml-4'>Pending Stops</Heading>
                    {/* Pending Stops Section */}
                    <VStack className='px-4' space='sm'>
                        {itinerary.stops.filter(s => !s.visited_at).map((item, index, arr) => {
                            const isLastPending = index === arr.length - 1;
                            const displayNumber = itinerary.stops.indexOf(item) + 1;

                            return (
                                <View key={item.id} className='relative'>
                                    {/* Timeline Line */}
                                    {!isLastPending && (
                                        <View className="absolute w-8 items-center" style={{ top: 32, bottom: -16 }}>
                                            <LinearGradient
                                                colors={[
                                                    theme.outline?.['300'] || '#e5e5e5',
                                                    theme.outline?.['800'] || '#e5e5e5'
                                                ]}
                                                style={{
                                                    width: 2,
                                                    flex: 1,
                                                    opacity: 0.5
                                                }}
                                            />
                                        </View>
                                    )}

                                    <Box
                                        className={'rounded-2xl border-transparent'}
                                    >
                                        <View className='py-2'>
                                            <StopListItem
                                                displayNumber={displayNumber}
                                                isVisited={false}
                                                landmark={item.place}
                                                onVisitToggle={() => handleVisitedPress(item)}
                                                onDelete={() => handleRemoveStop(item.id)}
                                                onLocate={() => locatePOI(item.place.longitude, item.place.latitude)}
                                                onShowStopInfo={() => onShowStopInfo(item)}
                                                visitDuration={item.visit_duration}
                                                onEditDuration={() => setEditingStop(item)}
                                            />
                                        </View>
                                    </Box>
                                </View>
                            );
                        })}
                    </VStack>


                    {itinerary.stops.length === 0 && (
                        <Box className='items-center justify-center py-20 px-10'>
                            <Box className='bg-background-50 p-6 rounded-full mb-4'>
                                <Icon as={PlusCircle} size='xl' className='text-typography-300' />
                            </Box>
                            <Text className='text-center text-typography-500 font-medium'>No stops added to your journey yet.</Text>
                            <TouchableOpacity onPress={handleAddPoi} className='mt-4'>
                                <Text className='text-primary-600 font-bold'>Add your first stop</Text>
                            </TouchableOpacity>
                        </Box>
                    )}
                </VStack>
            </VStack>
        </>
    );
}

