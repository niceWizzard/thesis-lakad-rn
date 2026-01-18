import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { Toast, ToastDescription, ToastTitle, useToast } from '@/components/ui/toast';
import { VStack } from '@/components/ui/vstack';
import { supabase } from '@/src/utils/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MapPin, Plus, Search } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList } from 'react-native';

export default function AddPOIScreen() {
    const { id: itineraryId, currentCount } = useLocalSearchParams();
    const router = useRouter();
    const toast = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [isAdding, setIsAdding] = useState<number | null>(null);
    const queryClient = useQueryClient()

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
        }
    });

    const handleAddStop = async (landmarkId: number) => {
        setIsAdding(landmarkId);
        try {
            const nextOrder = Number(currentCount) + 1;
            const newPoi = {
                itinerary_id: Number(itineraryId),
                landmark_id: landmarkId,
                visit_order: nextOrder,
            }
            console.log(itineraryId)
            const { error } = await supabase.from('poi').insert(newPoi);

            if (error) throw error;

            toast.show({
                placement: "top",
                render: ({ id }) => (
                    <Toast nativeID={"toast-" + id} action="success" className="rounded-2xl mt-10">
                        <VStack space="xs">
                            <ToastTitle>Added to Itinerary</ToastTitle>
                        </VStack>
                    </Toast>
                ),
            });
            await queryClient.refetchQueries({ queryKey: ['itinerary', itineraryId] })
            router.back(); // Return to the itinerary view
        } catch (e: any) {
            console.error(e);
            toast.show({
                placement: "top",
                render: ({ id }) => (
                    <Toast nativeID={"toast-" + id} action="error" className="rounded-2xl mt-10">
                        <VStack space="xs">
                            <ToastTitle>Added to Itinerary</ToastTitle>
                            <ToastDescription>{e.message}</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
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