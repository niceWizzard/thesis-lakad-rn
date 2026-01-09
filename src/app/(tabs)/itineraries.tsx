import { Stack, useRouter } from 'expo-router';
import {
    CheckCircle2,
    EllipsisVertical,
    MapPin, Play,
    Search,
    X
} from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, FlatList, Pressable, View } from 'react-native';

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
import { ItineraryWithStops } from '@/src/model/itinerary.types';
import { useAuthStore } from '@/src/stores/useAuth';
import { fetchItinerariesOfUser } from '@/src/utils/fetchItineraries';
import {
    useQuery,
} from '@tanstack/react-query';


export default function ItinerariesScreen() {
    const [searchString, setSearchString] = useState('');
    const auth = useAuthStore();
    const userId = auth.session?.user?.id;
    const { data: itineraries, isLoading, } = useQuery<ItineraryWithStops[]>({
        queryKey: ['itineraries',],
        initialData: [],
        queryFn: () => fetchItinerariesOfUser(userId!),
        enabled: !!userId,
    })
    const router = useRouter();

    const handleDeleteItinerary = (itinerary: ItineraryWithStops) => {
        Alert.alert(
            'Delete Itinerary',
            `Are you sure you want to delete "${itinerary.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => { } }
            ]
        );
    };

    const calculateProgress = (itinerary: ItineraryWithStops) => {
        if (itinerary.stops.length === 0) return 0;
        const completed = itinerary.stops.filter(stop => !!stop.poi.visited_at).length;
        return (completed / itinerary.stops.length) * 100;
    };

    const handleContinuePress = (id: number) => {
        router.push({
            pathname: '/itinerary/[id]',
            params: { id: itineraries.find(v => v.id === id)!.id }
        })
    }

    const filteredItineraries = itineraries.filter(v =>
        v.name.toLowerCase().includes(searchString.toLowerCase())
    );

    return (
        <>
            {/* Simple Native Header */}
            <Stack.Screen options={{ headerTitle: "My Trips" }} />

            <Box className="flex-1 bg-background-0">
                <FlatList
                    data={filteredItineraries}
                    keyExtractor={item => `itinerary-${item.id}`}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="always"
                    contentContainerClassName="p-6 pb-32 gap-6"
                    // --- SEARCH BAR ADDED AS HEADER OF THE LIST ---
                    ListHeaderComponent={
                        <VStack className="mb-2 gap-4">
                            <Input
                                variant="rounded"
                                size="lg"
                                className="border-none bg-background-100 h-12 rounded-2xl"
                            >
                                <InputSlot className="pl-4">
                                    <InputIcon as={Search} className="text-typography-400" />
                                </InputSlot>
                                <InputField
                                    placeholder="Search your trips..."
                                    value={searchString}
                                    onChangeText={setSearchString}
                                    className="text-typography-900"
                                />
                                {searchString.length > 0 && (
                                    <InputSlot className="pr-4" onPress={() => setSearchString('')}>
                                        <InputIcon as={X} className="text-typography-400" size='lg' />
                                    </InputSlot>
                                )}
                            </Input>
                        </VStack>
                    }
                    renderItem={({ item: itinerary }) => {
                        const progress = calculateProgress(itinerary);
                        return (
                            <Pressable className="bg-background-50 rounded-3xl border border-outline-100 shadow-soft-1 overflow-hidden">
                                <View className="p-5">
                                    {/* Card Header */}
                                    <HStack className="justify-between items-start mb-4">
                                        <VStack className="flex-1 pr-4">
                                            <HStack className="items-center mb-1 gap-1">
                                                <Icon as={MapPin} size="xs" className="text-primary-600" />
                                                <Text size="xs" className="uppercase font-bold text-primary-600 tracking-wider">Itinerary</Text>
                                            </HStack>
                                            <Heading size="lg" className="text-typography-900">{itinerary.name}</Heading>
                                        </VStack>
                                        <Pressable onPress={() => handleDeleteItinerary(itinerary)} className="p-2">
                                            <Icon as={EllipsisVertical} className="text-typography-400" />
                                        </Pressable>
                                    </HStack>

                                    {/* Progress */}
                                    <VStack className="mb-6 gap-2">
                                        <HStack className="justify-between items-end">
                                            <Text size="sm" className="font-medium text-typography-700">Trip Progress</Text>
                                            <Text size="xs" className="text-typography-500 font-bold">
                                                {itinerary.stops.filter(stop => !!stop.poi.visited_at).length}/{itinerary.stops.length}
                                            </Text>
                                        </HStack>
                                        <Progress value={progress} className="h-2 bg-background-100">
                                            <ProgressFilledTrack className="bg-primary-600" />
                                        </Progress>
                                    </VStack>

                                    {/* POI Preview */}
                                    <VStack className="bg-background-0 rounded-2xl p-4 border border-outline-50 gap-3 mb-5">
                                        {itinerary.stops.slice(0, 3).map((stop, index) => (
                                            <HStack key={index} className="items-center justify-between">
                                                <HStack className="items-center gap-3 flex-1">
                                                    <Icon
                                                        as={stop.poi.visited_at ? CheckCircle2 : MapPin}
                                                        className={stop.poi.visited_at ? "text-success-500" : "text-typography-300"}
                                                        size="sm"
                                                    />
                                                    <Text size="sm" className={stop.poi.visited_at ? "text-typography-400 line-through" : "text-typography-700"}>
                                                        {stop.poi.landmark?.name ?? "Uknown landmark"}
                                                    </Text>
                                                </HStack>
                                            </HStack>
                                        ))}
                                    </VStack>

                                    <Button size="lg" className="rounded-2xl bg-primary-600"
                                        onPress={() => handleContinuePress(itinerary.id)}
                                    >
                                        <ButtonIcon as={Play} className="mr-2" />
                                        <ButtonText className="font-bold">Continue</ButtonText>
                                    </Button>
                                </View>
                            </Pressable>
                        );
                    }}
                />

                {/* FABs */}
                <ExpandableFab />
            </Box>
        </>
    );
}