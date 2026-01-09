import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { ItineraryWithStops } from '@/src/model/itinerary.types';
import { useAuthStore } from '@/src/stores/useAuth';
import { fetchItineraryById } from '@/src/utils/fetchItineraries';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { CheckCircleIcon, CircleIcon } from 'lucide-react-native';
import React from 'react';
import { FlatList } from 'react-native';

const ItineraryScreen = () => {
    const { id } = useLocalSearchParams()
    const auth = useAuthStore();
    const userId = auth.session?.user?.id;
    const {
        data: currentItinerary,
        isLoading,
    } = useQuery({
        queryKey: ['itinerary', id],
        queryFn: () => fetchItineraryById(userId!, Number.parseInt(id.toString())),
        enabled: !!userId && !!id,
    })

    if (!currentItinerary) {
        return (
            <Box className='justify-center items-center w-full h-full bg-background-0'>
                <Text>Invalid itinerary id</Text>
            </Box>
        )
    }

    const renderItem = ({ item }: { item: ItineraryWithStops['stops'][number] }) => (
        // Added border color tokens to ensure visibility in dark mode
        <Box className="px-5 py-4 border-b border-outline-50 dark:border-outline-700">
            <HStack className="justify-between items-center">
                <VStack>
                    <Text className="text-lg font-bold text-typography-900">
                        {item.poi?.landmark?.name ?? "Unknown Landmark"}
                    </Text>
                    <Text className="text-sm text-typography-500">
                        {item.poi.landmark!.latitude!.toFixed(3)}, {item.poi.landmark!.longitude!.toFixed(3)}
                    </Text>
                </VStack>

                <Box className="items-center justify-center">
                    {item.poi.visited_at ? (
                        <Icon as={CheckCircleIcon} className="text-success-500" size="xl" />
                    ) : (
                        // Changed background-300 to typography-300 for better stroke visibility
                        <Icon as={CircleIcon} className="text-typography-300" size="xl" />
                    )}
                </Box>
            </HStack>
        </Box>
    );

    return (
        // Added explicit background tokens
        <Box className="flex-1 bg-background-50">
            <VStack className="pt-12 pb-6 px-5">
                <Heading className="text-3xl font-extrabold text-typography-900">
                    {currentItinerary.name}
                </Heading>
                <Text className="text-typography-400 uppercase tracking-widest text-xs">
                    Itinerary ID: {currentItinerary.id}
                </Text>
            </VStack>

            <FlatList
                data={currentItinerary.stops}
                renderItem={renderItem}
                keyExtractor={(item) => `stop-${item.poi.id}`}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </Box>
    );
};

export default ItineraryScreen;