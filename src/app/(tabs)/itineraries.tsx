import { Stack, useFocusEffect, useRouter } from 'expo-router';
import {
    ClipboardList,
    EllipsisVertical,
    MapPin, Play,
    Search
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, View } from 'react-native';

import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Progress, ProgressFilledTrack } from '@/components/ui/progress';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

import ExpandableFab from '@/src/components/ExpandableFAB';
import ItinerarySkeleton from '@/src/components/ItinerarySkeleton';
import { ItineraryWithStops } from '@/src/model/itinerary.types';
import { useAuthStore } from '@/src/stores/useAuth';
import { fetchItinerariesOfUser } from '@/src/utils/fetchItineraries';
import { useQuery } from '@tanstack/react-query';

export default function ItinerariesScreen() {
    const [searchString, setSearchString] = useState('');
    const auth = useAuthStore();
    const userId = auth.session?.user?.id;
    const router = useRouter();

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

    useFocusEffect(
        useCallback(() => {
            // Manually refetch every time the user navigates to this tab
            refetch();
        }, [refetch])
    );

    const calculateProgress = (itinerary: ItineraryWithStops) => {
        if (!itinerary.stops || itinerary.stops.length === 0) return 0;
        const completed = itinerary.stops.filter(stop => !!stop.poi.visited_at).length;
        return (completed / itinerary.stops.length) * 100;
    };

    const filteredItineraries = itineraries.filter(v =>
        v.name.toLowerCase().includes(searchString.toLowerCase())
    );

    // --- 1. SEPARATE LOADING LIST ---
    if (isLoading && itineraries.length === 0) {
        return (
            <Box className="flex-1 bg-background-0">
                <Stack.Screen options={{ headerTitle: "My Trips" }} />
                <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="p-6 gap-6">
                    <Box className="h-12 w-full bg-background-100 rounded-2xl mb-2" />
                    <ItinerarySkeleton />
                    <ItinerarySkeleton />
                    <ItinerarySkeleton />
                </ScrollView>
            </Box>
        );
    }

    // --- 2. SEPARATE EMPTY VIEW ---
    if (!isLoading && itineraries.length === 0) {
        return (
            <Box className="flex-1 bg-background-0 justify-center items-center p-10">
                <Stack.Screen options={{ headerTitle: "My Trips" }} />
                <View className="bg-primary-50 p-6 rounded-full mb-6">
                    <Icon as={ClipboardList} size="xl" className="text-primary-600" />
                </View>
                <Heading size="xl" className="text-center mb-2">No Trips Found</Heading>
                <Text className="text-center text-typography-500 mb-8">
                    Start exploring and create your first walking itinerary!
                </Text>
                <ExpandableFab />
            </Box>
        );
    }

    // --- 3. MAIN DATA LIST ---
    return (
        <Box className="flex-1 bg-background-0">
            <Stack.Screen options={{ headerTitle: "My Trips" }} />

            <FlatList
                data={filteredItineraries}
                keyExtractor={(item) => `itinerary-${item.id}`}
                showsVerticalScrollIndicator={false}
                contentContainerClassName="p-6 pb-32 gap-6"
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#4f46e5" />
                }
                ListHeaderComponent={
                    <VStack className="mb-2 gap-4">
                        <Input variant="rounded" size="lg" className="border-none bg-background-100 h-12 rounded-2xl">
                            <InputSlot className="pl-4">
                                <InputIcon as={Search} className="text-typography-400" />
                            </InputSlot>
                            <InputField
                                placeholder="Search your trips..."
                                value={searchString}
                                onChangeText={setSearchString}
                                className="text-typography-900"
                            />
                        </Input>
                    </VStack>
                }
                renderItem={({ item: itinerary }) => {
                    const progress = calculateProgress(itinerary);
                    return (
                        <Pressable
                            className="bg-background-50 rounded-3xl border border-outline-100 shadow-soft-1 overflow-hidden active:opacity-90"
                            onPress={() => router.push({ pathname: '/itinerary/[id]', params: { id: itinerary.id } })}
                        >
                            <View className="p-5">
                                <HStack className="justify-between items-start mb-4">
                                    <VStack className="flex-1 pr-4">
                                        <HStack className="items-center mb-1 gap-1">
                                            <Icon as={MapPin} size="xs" className="text-primary-600" />
                                            <Text size="xs" className="uppercase font-bold text-primary-600 tracking-wider">
                                                {itinerary.stops.length} Stops
                                            </Text>
                                        </HStack>
                                        <Heading size="lg" className="text-typography-900">{itinerary.name}</Heading>
                                    </VStack>
                                    <Icon as={EllipsisVertical} className="text-typography-400 mt-2" />
                                </HStack>

                                <Progress value={progress} className="h-2 bg-background-100 mb-6">
                                    <ProgressFilledTrack className="bg-primary-600" />
                                </Progress>

                                <Button size="lg" className="rounded-2xl bg-primary-600 shadow-soft-2">
                                    <ButtonIcon as={Play} className="mr-2" />
                                    <ButtonText className="font-bold">Continue Journey</ButtonText>
                                </Button>
                            </View>
                        </Pressable>
                    );
                }}
            />

            <ExpandableFab />
        </Box>
    );
}