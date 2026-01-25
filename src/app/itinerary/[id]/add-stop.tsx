import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useToastNotification } from '@/src/hooks/useToastNotification';
import { useAuthStore } from '@/src/stores/useAuth';
import { calculateItineraryDistance } from '@/src/utils/calculateItineraryDistance';
import { fetchItineraryById } from '@/src/utils/fetchItineraries';
import { supabase } from '@/src/utils/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MapPin, Plus, Search } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList } from 'react-native';

export default function AddPOIScreen() {
    const { id: itineraryId, currentCount } = useLocalSearchParams();
    const { session } = useAuthStore()
    const router = useRouter();
    const { showToast } = useToastNotification();
    const [searchQuery, setSearchQuery] = useState('');
    const [isAdding, setIsAdding] = useState<number | null>(null);
    const queryClient = useQueryClient()

    const userId = session?.user.id;

    // Fetch Landmarks that aren't already in the itinerary might be ideal, 
    // but for now, we fetch all and filter by search.
    const { data: landmarks, isLoading } = useQuery({
        queryKey: ['landmarks', searchQuery],
        queryFn: async () => {
            let query = supabase.from('landmark').select('*').is('deleted_at', null);
            if (searchQuery) {
                query = query.ilike('name', `%${searchQuery}%`);
            }
            const { data, error } = await query.limit(20);
            if (error) throw error;
            return data;
        },
        enabled: !!userId,
    });

    if (!userId || !itineraryId) {
        return null;
    }

    const handleAddStop = async (landmarkId: number) => {
        setIsAdding(landmarkId);
        try {
            const parsedId = Number(itineraryId);
            const nextOrder = Number(currentCount) + 1;
            const newPoi = {
                itinerary_id: Number(itineraryId),
                landmark_id: landmarkId,
                visit_order: nextOrder,
            }
            const { error } = await supabase.from('stops').insert(newPoi);

            if (error) throw error;

            showToast({
                title: "Added to Itinerary",
            })

            const itinerary = await queryClient.fetchQuery({
                queryKey: ['itinerary', itineraryId],
                queryFn: () => fetchItineraryById(userId, parsedId)
            })

            if (itinerary.stops.length > 1) {

                const newDistance = await calculateItineraryDistance(
                    itinerary.stops.map((stop) => [stop.landmark.longitude, stop.landmark.latitude])
                )

                const { error } = await supabase.from('itinerary').update({ distance: newDistance }).eq('id', parsedId);
                if (error) throw error;

                await queryClient.invalidateQueries({ queryKey: ['itinerary', itineraryId] });
                await queryClient.invalidateQueries({ queryKey: ['itineraries'] });
            }


            router.back(); // Return to the itinerary view
        } catch (e: any) {
            console.error(e);
            showToast({
                title: "Error",
                description: e.message,
                action: 'error',
            })
        } finally {
            setIsAdding(null);
        }
    };

    return (
        <Box className="flex-1 bg-background-0">
            <VStack className="p-4 pt-12" space="lg">
                <Input variant="rounded" size="lg" className="bg-background-50 border-none">
                    <InputSlot className="pl-4">
                        <InputIcon as={Search} />
                    </InputSlot>
                    <InputField
                        placeholder="Search landmarks..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </Input>

                {isLoading ? (
                    <ActivityIndicator size="large" className="mt-10" />
                ) : (
                    <FlatList
                        data={landmarks}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={{ paddingBottom: 40 }}
                        renderItem={({ item }) => (
                            <HStack className="py-4 border-b border-outline-50 items-center justify-between">
                                <HStack space="md" className="flex-1 items-center">
                                    <Box className="bg-primary-50 p-3 rounded-full">
                                        <Icon as={MapPin} className="text-primary-600" size="sm" />
                                    </Box>
                                    <VStack className="flex-1">
                                        <Text className="font-bold text-typography-900">{item.name}</Text>
                                        <Text size="xs" className="text-typography-500">{item.municipality}</Text>
                                    </VStack>
                                </HStack>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    action="primary"
                                    className="rounded-xl"
                                    onPress={() => handleAddStop(item.id)}
                                    isDisabled={isAdding === item.id}
                                >
                                    {isAdding === item.id ? (
                                        <ActivityIndicator size="small" />
                                    ) : (
                                        <>
                                            <ButtonIcon as={Plus} />
                                            <ButtonText className="ml-1">Add</ButtonText>
                                        </>
                                    )}
                                </Button>
                            </HStack>
                        )}
                    />
                )}
            </VStack>
        </Box>
    );
}