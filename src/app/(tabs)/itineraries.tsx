import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import { ArrowUpDown, ClipboardList, EllipsisVertical, Eye, MapPin, Play, Ruler, Search, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';

import { Actionsheet, ActionsheetBackdrop, ActionsheetContent, ActionsheetDragIndicator, ActionsheetDragIndicatorWrapper, ActionsheetItem, ActionsheetItemText } from '@/components/ui/actionsheet';
import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Progress, ProgressFilledTrack } from '@/components/ui/progress';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Pressable } from 'react-native-gesture-handler';

import ExpandableFab from '@/src/components/ExpandableFAB';
import ItinerarySkeleton from '@/src/components/ItinerarySkeleton';
import { ItineraryWithStops } from '@/src/model/itinerary.types';
import { useAuthStore } from '@/src/stores/useAuth';
import { fetchItinerariesOfUser } from '@/src/utils/fetchItineraries';
import { formatDate } from '@/src/utils/format/date';
import { formatDistance } from '@/src/utils/format/distance';
import { useQuery } from '@tanstack/react-query';

export default function ItinerariesScreen() {
    const [searchString, setSearchString] = useState('');
    const auth = useAuthStore();
    const userId = auth.session?.user?.id;
    const router = useRouter();
    const [showActionsheet, setShowActionsheet] = useState(false);
    const [sortOption, setSortOption] = useState<'date' | 'name' | 'stops'>('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const {
        data: itineraries = [],
        isLoading,
        isRefetching,
        refetch
    } = useQuery<ItineraryWithStops[]>({
        queryKey: ['itineraries', userId],
        queryFn: () => fetchItinerariesOfUser(userId!),
        enabled: !!userId,
    });

    // Memoize filtered data for performance
    const filteredItineraries = useMemo(() => {
        let result = itineraries.filter(v =>
            v.name.toLowerCase().includes(searchString.toLowerCase())
        );

        return result.sort((a, b) => {
            let comparison = 0;
            switch (sortOption) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'stops':
                    comparison = (a.stops?.length || 0) - (b.stops?.length || 0);
                    break;
                case 'date':
                default:
                    comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                    break;
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [itineraries, searchString, sortOption, sortDirection]);

    const handleSort = (option: 'date' | 'name' | 'stops', direction: 'asc' | 'desc') => {
        setSortOption(option);
        setSortDirection(direction);
        setShowActionsheet(false);
    };

    const calculateProgress = (itinerary: ItineraryWithStops) => {
        if (!itinerary.stops?.length) return 0;
        const completed = itinerary.stops.filter(stop => !!stop.visited_at).length;
        return (completed / itinerary.stops.length) * 100;
    };

    const handlePress = (id: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.navigate({ pathname: '/itinerary/[id]', params: { id } });
    };

    // --- 1. LOADING STATE ---
    if (isLoading && itineraries.length === 0) {
        return (
            <Box className="flex-1 bg-background-0 p-6 gap-6">
                <Stack.Screen options={{ headerTitle: "My Trips" }} />
                <Box className="h-12 w-full bg-background-100 rounded-2xl mb-2" />
                {[1, 2, 3].map((i) => <ItinerarySkeleton key={i} />)}
            </Box>
        );
    }

    // --- 2. EMPTY STATE (No Itineraries at all) ---
    if (!isLoading && itineraries.length === 0) {
        return (
            <Box className="flex-1 bg-background-0 justify-center items-center p-10">
                <Stack.Screen options={{ headerTitle: "My Trips" }} />
                <Box className="bg-primary-50 p-6 rounded-full mb-6">
                    <Icon as={ClipboardList} size="xl" className="text-primary-600" />
                </Box>
                <Heading size="xl" className="text-center mb-2">No Trips Found</Heading>
                <Text className="text-center text-typography-500 mb-8">
                    Start exploring and create your first walking itinerary!
                </Text>
                <ExpandableFab />
            </Box>
        );
    }

    return (
        <Box className="flex-1 bg-background-0">
            <Stack.Screen options={{ headerTitle: "My Trips" }} />
            <FlatList
                data={filteredItineraries}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerClassName="p-6 pb-32 gap-6"
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={refetch}
                        tintColor="#4f46e5"
                    />
                }
                ListHeaderComponent={
                    <VStack className="mb-2">
                        <HStack className="gap-3">
                            <Input variant="rounded" size="lg" className="flex-1 border-none bg-background-100 h-14 rounded-2xl px-4">
                                <InputSlot>
                                    <InputIcon as={Search} className="text-typography-400" />
                                </InputSlot>
                                <InputField
                                    placeholder="Search your trips..."
                                    value={searchString}
                                    onChangeText={setSearchString}
                                    className="text-typography-900"
                                />
                                {searchString.length > 0 && (
                                    <InputSlot onPress={() => setSearchString('')}>
                                        <Icon as={X} size="sm" className="text-typography-400" />
                                    </InputSlot>
                                )}
                            </Input>
                            <Button
                                size="lg"
                                className="h-14 w-14 rounded-2xl p-0"
                                onPress={() => setShowActionsheet(true)}
                                variant='outline'
                                action='secondary'
                            >
                                <ButtonIcon as={ArrowUpDown} className="text-typography-500" />
                            </Button>
                        </HStack>
                    </VStack>
                }
                ListEmptyComponent={
                    <VStack className="items-center py-20">
                        <Text className="text-typography-400 italic">No trips match your search.</Text>
                    </VStack>
                }
                renderItem={({ item: itinerary }) => {
                    const progress = calculateProgress(itinerary);
                    const isComplete = progress === 100;

                    return (
                        <Pressable
                            onPress={() => handlePress(itinerary.id)}
                        >
                            <View
                                className="p-5 rounded-3xl bg-background-50 border border-success-200"
                                style={{
                                    shadowColor: '#22c55e',
                                    shadowOffset: { width: 0, height: 0 },
                                    shadowOpacity: 0.5,
                                    shadowRadius: 10,
                                    elevation: 5
                                }}
                            >
                                <HStack className="justify-between items-start mb-4">
                                    <VStack className="flex-1 pr-4">
                                        <Text size="xs" className="uppercase font-bold text-typography-500 tracking-wider mb-1">
                                            {formatDate(itinerary.created_at)}
                                        </Text>
                                        <Heading size="lg" className="text-typography-900 leading-tight mb-2">
                                            {itinerary.name}
                                        </Heading>
                                        <HStack className="items-center gap-3">
                                            <HStack className="items-center gap-1.5">
                                                <Icon as={MapPin} size="xs" className="text-primary-600" />
                                                <Text size="xs" className="font-bold text-typography-600">
                                                    {itinerary.stops?.length || 0} Stops
                                                </Text>
                                            </HStack>
                                            <Box className="w-1 h-1 rounded-full bg-typography-300" />
                                            <HStack className="items-center gap-1.5">
                                                <Icon as={Ruler} size="xs" className="text-primary-600" />
                                                <Text size="xs" className="font-bold text-typography-600">
                                                    {formatDistance(itinerary.distance)}
                                                </Text>
                                            </HStack>
                                        </HStack>
                                    </VStack>
                                    <Pressable hitSlop={32}
                                        onPress={() => {
                                            router.navigate({
                                                pathname: '/itinerary/[id]/info',
                                                params: { id: itinerary.id },
                                            })
                                        }}
                                    >
                                        <Icon as={EllipsisVertical} className="text-typography-400 mt-1" />
                                    </Pressable>
                                </HStack>

                                {/* Stops Preview */}
                                {itinerary.stops && itinerary.stops.length > 0 && (
                                    <VStack className="mb-6 gap-2 bg-background-100/50 p-3 rounded-xl">
                                        {itinerary.stops.slice(0, 3).map((stop, index) => (
                                            <HStack key={stop.id} className="items-center gap-2">
                                                <Box className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                                                <Text size="sm" className="text-typography-600 flex-1" numberOfLines={1}>
                                                    {stop.landmark.name}
                                                </Text>
                                            </HStack>
                                        ))}
                                        {itinerary.stops.length > 3 && (
                                            <Text size="xs" className="text-typography-400 pl-3.5 pt-1">
                                                +{itinerary.stops.length - 3} more stops
                                            </Text>
                                        )}
                                    </VStack>
                                )}

                                <VStack className="gap-2 mb-6">
                                    <HStack className="justify-between items-end">
                                        <Text size="sm" className="text-typography-500 font-medium">Progress</Text>
                                        <Text size="sm" className="text-typography-900 font-bold">{Math.round(progress)}%</Text>
                                    </HStack>
                                    <Progress value={progress} className="h-2 bg-background-100 rounded-full">
                                        <ProgressFilledTrack className={isComplete ? "bg-success-500" : "bg-primary-600"} />
                                    </Progress>
                                </VStack>

                                <Button
                                    size="lg"
                                    onPress={() => handlePress(itinerary.id)}
                                    className={`rounded-2xl shadow-soft-2 ${isComplete ? 'bg-success-600' : 'bg-primary-600'}`}
                                >
                                    <ButtonIcon as={progress === 0 ? Play : (isComplete ? Eye : Play)} className="mr-2" />
                                    <ButtonText className="font-bold">
                                        {progress === 0 ? 'Start' : (isComplete ? 'View' : 'Continue')}
                                    </ButtonText>
                                </Button>
                            </View>
                        </Pressable>
                    );
                }}
            />

            <ExpandableFab />

            <Actionsheet isOpen={showActionsheet} onClose={() => setShowActionsheet(false)} snapPoints={[50]}>
                <ActionsheetBackdrop />
                <ActionsheetContent>
                    <ActionsheetDragIndicatorWrapper>
                        <ActionsheetDragIndicator />
                    </ActionsheetDragIndicatorWrapper>
                    <Heading size="md" className="mb-4 text-typography-500 uppercase tracking-widest text-center">Sort By</Heading>

                    <ActionsheetItem onPress={() => handleSort('date', 'desc')}>
                        <ActionsheetItemText className={sortOption === 'date' && sortDirection === 'desc' ? 'font-bold text-primary-600' : ''}>
                            Date (Newest First)
                        </ActionsheetItemText>
                    </ActionsheetItem>
                    <ActionsheetItem onPress={() => handleSort('date', 'asc')}>
                        <ActionsheetItemText className={sortOption === 'date' && sortDirection === 'asc' ? 'font-bold text-primary-600' : ''}>
                            Date (Oldest First)
                        </ActionsheetItemText>
                    </ActionsheetItem>

                    <ActionsheetItem onPress={() => handleSort('name', 'asc')}>
                        <ActionsheetItemText className={sortOption === 'name' && sortDirection === 'asc' ? 'font-bold text-primary-600' : ''}>
                            Name (A-Z)
                        </ActionsheetItemText>
                    </ActionsheetItem>
                    <ActionsheetItem onPress={() => handleSort('name', 'desc')}>
                        <ActionsheetItemText className={sortOption === 'name' && sortDirection === 'desc' ? 'font-bold text-primary-600' : ''}>
                            Name (Z-A)
                        </ActionsheetItemText>
                    </ActionsheetItem>

                    <ActionsheetItem onPress={() => handleSort('stops', 'desc')}>
                        <ActionsheetItemText className={sortOption === 'stops' && sortDirection === 'desc' ? 'font-bold text-primary-600' : ''}>
                            Stops (Most First)
                        </ActionsheetItemText>
                    </ActionsheetItem>
                    <ActionsheetItem onPress={() => handleSort('stops', 'asc')}>
                        <ActionsheetItemText className={sortOption === 'stops' && sortDirection === 'asc' ? 'font-bold text-primary-600' : ''}>
                            Stops (Least First)
                        </ActionsheetItemText>
                    </ActionsheetItem>
                </ActionsheetContent>
            </Actionsheet>
        </Box>
    );
}