import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import debounce from 'lodash.debounce';
import { Map as MapIcon, MapPin, Plus, Search, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable } from 'react-native';

// UI Components
import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

// Logic & Utils
import { LocationDialogSelection } from '@/src/components/LocationDialogSelection';
import { useToastNotification } from '@/src/hooks/useToastNotification';
import { createLandmark, insertLandmarkToItinerary } from '@/src/utils/landmark/insertLandmark';
import { supabase } from '@/src/utils/supabase';

export default function AddPOIScreen() {
    const { id: itineraryId, currentCount } = useLocalSearchParams();
    const router = useRouter();
    const { showToast } = useToastNotification();
    const queryClient = useQueryClient();

    const [showManualDialog, setShowManualDialog] = useState(false)

    const [searchQuery, setSearchQuery] = useState('');

    const debouncedSearch = useMemo(
        () => debounce((text: string) => setSearchQuery(text), 300),
        []
    );

    const { data: landmarks, isLoading } = useQuery({
        queryKey: ['landmarks', searchQuery],
        queryFn: async () => {
            let query = supabase.from('landmark')
                .select('id, name, municipality, image_url, type')
                .is('deleted_at', null);

            if (searchQuery) {
                query = query.ilike('name', `%${searchQuery}%`);
            }
            const { data, error } = await query.limit(15);
            if (error) throw error;
            return data;
        },
    });

    const addStopMutation = useMutation({
        mutationFn: async (landmarkId: number) => insertLandmarkToItinerary({
            currentCount: currentCount.toString(),
            itineraryId: itineraryId.toString(),
            landmarkId: landmarkId.toString(),
        }),
        onSuccess: async () => {
            // Invalidate queries so the itinerary refreshes when we go back
            await queryClient.invalidateQueries({ queryKey: ['itinerary', itineraryId] });
            await queryClient.invalidateQueries({ queryKey: ['itineraries'] });
            showToast({ title: "Added to Itinerary", action: "success" });
            router.back();
        },
        onError: (error: any) => {
            showToast({ title: "Error", description: error.message, action: "error" });
        }
    });

    const handleAddManualLocation = async (location: GeoJSON.Position) => {
        try {
            const landmarkId = await createLandmark({
                name: `${location[1]}, ${location[0]}`,
                longitude: location[0],
                latitude: location[1],
                district: "1",
                municipality: 'Angat',
                creation_type: "PERSONAL",
            });
            await addStopMutation.mutateAsync(landmarkId)

        } catch (e: any) {
            showToast({ title: "Error", description: e.message, action: "error" });
        }
    }

    return (
        <>
            <LocationDialogSelection
                show={showManualDialog}
                onClose={() => setShowManualDialog(false)}
                onConfirmLocation={handleAddManualLocation}
            />
            <Box className="flex-1 bg-background-0">
                <VStack className="p-6 pt-12 flex-1" space="xl">
                    <VStack space="xs">
                        <Heading size="xl">Add a Stop</Heading>
                        <Text size="sm" className="text-typography-500">Find landmarks to add to your journey</Text>
                    </VStack>

                    <Input variant="outline" size="xl" className="rounded-2xl bg-background-50 border-outline-100">
                        <InputSlot className="pl-4">
                            <InputIcon as={Search} className="text-primary-500" />
                        </InputSlot>
                        <InputField
                            placeholder="Search landmarks..."
                            onChangeText={debouncedSearch}
                        />
                        {searchQuery.length > 0 && (
                            <InputSlot className="pr-4" onPress={() => setSearchQuery('')}>
                                <Icon as={X} size="sm" />
                            </InputSlot>
                        )}
                    </Input>

                    {isLoading ? (
                        <VStack className="flex-1 justify-center items-center" space="md">
                            <ActivityIndicator size="large" color="#0891b2" />
                            <Text size="sm" className="text-typography-400">Loading landmarks...</Text>
                        </VStack>
                    ) : (
                        <FlatList
                            data={landmarks}
                            keyExtractor={(item) => item.id.toString()}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <VStack className="items-center justify-center py-20" space="md">
                                    <Icon as={MapIcon} size="xl" className="text-outline-200" />
                                    <Text className="text-typography-400">No landmarks found</Text>
                                </VStack>
                            }
                            renderItem={({ item }) => (
                                <Pressable
                                    className="mb-4 bg-background-0 border border-outline-100 rounded-3xl overflow-hidden active:bg-background-50"
                                    onPress={() => router.navigate({
                                        pathname: '/landmark/[id]/view',
                                        params: {
                                            id: item.id.toString(),
                                            itineraryId: itineraryId.toString(),
                                            currentCount: currentCount,
                                        },
                                    })}
                                >
                                    <HStack className="items-center p-3" space="md">
                                        {/* Thumbnail Preview */}
                                        <Box className="h-16 w-16 bg-background-100 rounded-2xl overflow-hidden">
                                            {item.image_url ? (
                                                <Image source={{ uri: item.image_url }} className="w-full h-full" />
                                            ) : (
                                                <Box className="items-center justify-center flex-1">
                                                    <Icon as={MapPin} className="text-outline-300" />
                                                </Box>
                                            )}
                                        </Box>

                                        <VStack className="flex-1">
                                            <Text className="font-bold text-typography-900" numberOfLines={1}>
                                                {item.name}
                                            </Text>
                                            <HStack space="xs" className="items-center">
                                                <Icon as={MapPin} size="xs" className="text-typography-400" />
                                                <Text size="xs" className="text-typography-500">
                                                    {item.municipality}
                                                </Text>
                                            </HStack>
                                        </VStack>

                                        <Button
                                            size="sm"
                                            action="primary"
                                            className="rounded-xl h-10 w-10 p-0"
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                return addStopMutation.mutate(item.id);
                                            }}
                                            isDisabled={addStopMutation.isPending}
                                        >
                                            {addStopMutation.isPending && addStopMutation.variables === item.id ? (
                                                <ButtonSpinner />
                                            ) : (
                                                <ButtonIcon as={Plus} />
                                            )}
                                        </Button>
                                    </HStack>
                                </Pressable>
                            )}
                        />
                    )}
                    <Button onPress={() => setShowManualDialog(true)}>
                        <ButtonText>Add Manually </ButtonText>
                    </Button>
                </VStack>
            </Box>
        </>
    );
}


