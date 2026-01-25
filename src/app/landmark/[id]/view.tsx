import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
    ArrowLeft,
    Info,
    LocateIcon,
    MapPin,
    Share2,
    Star
} from 'lucide-react-native';
import React from 'react';
import { Image, ScrollView, Share, TouchableOpacity } from 'react-native';

import { Badge, BadgeText } from '@/components/ui/badge';
import { Box } from '@/components/ui/box';
import { Button, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

import { useToastNotification } from '@/src/hooks/useToastNotification';
import { fetchLandmarkById } from '@/src/utils/fetchLandmarks';
import { insertLandmarkToItinerary } from '@/src/utils/insertLandmark';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export default function LandmarkViewerScreen() {
    const { id, previewMode, itineraryId, currentCount } = useLocalSearchParams();
    const router = useRouter();

    const { showToast } = useToastNotification()
    const queryClient = useQueryClient()

    const { data: landmark } = useQuery({
        queryKey: ['landmark', id],
        queryFn: () => fetchLandmarkById(Number.parseInt(id!.toString())),
        enabled: !!id,
    })

    const {
        isPending,
        mutate: addStopMutation
    } = useMutation({
        mutationFn: async (landmarkId: number) => insertLandmarkToItinerary({
            currentCount: currentCount.toString(),
            itineraryId: itineraryId.toString(),
            landmarkId: landmarkId.toString(),
        }),
        onSuccess: () => {
            // Invalidate queries so the itinerary refreshes when we go back
            queryClient.invalidateQueries({ queryKey: ['itinerary', itineraryId] });
            showToast({ title: "Added to Itinerary", action: "success" });
            router.back();
        },
        onError: (error: any) => {
            showToast({ title: "Error", description: error.message, action: "error" });
        }
    });

    if (!landmark)
        return <Text>Landmark not found</Text>;

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out ${landmark.name} on Lakad App! Location: ${landmark.latitude}, ${landmark.longitude}`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddToItinerary = () => {
        if (itineraryId && currentCount) {
            addStopMutation(landmark.id);
        } else {
        }
    }



    return (
        <Box className="flex-1 bg-background-0">
            {/* Custom Header Overlays */}
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView showsVerticalScrollIndicator={false} bounces={false}
                style={{ flex: 1 }}
            >
                {/* 1. Hero Image Section */}
                <Box className="relative w-full h-[350px]">
                    <Image
                        source={{ uri: landmark.image_url || 'https://via.placeholder.com/600x400' }}
                        className="w-full h-full"
                        resizeMode="cover"
                    />
                    {/* Top Action Bar */}
                    <HStack className="absolute top-12 left-4 right-4 justify-between items-center">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="bg-black/30 p-2 rounded-full blur-md"
                        >
                            <ArrowLeft color="white" size={24} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleShare}
                            className="bg-black/30 p-2 rounded-full"
                        >
                            <Share2 color="white" size={24} />
                        </TouchableOpacity>
                    </HStack>
                </Box>

                {/* 2. Content Section */}
                <VStack className="px-6 py-8 -mt-10 bg-background-0 rounded-t-[40px] gap-6">
                    {/* Title & Tags */}
                    <VStack className="gap-2">
                        <Badge action="info" variant="outline" className="self-start rounded-lg border-primary-200">
                            <BadgeText className="text-primary-600 font-bold uppercase text-[10px]">Historical Site</BadgeText>
                        </Badge>
                        <Heading size="2xl" className="text-typography-900 leading-tight">
                            {landmark.name}
                        </Heading>
                        <HStack className="items-center gap-1">
                            <Icon as={MapPin} size="xs" className="text-typography-400" />
                            <Text size="sm" className="text-typography-500 font-medium">
                                Bulacan, Philippines
                            </Text>
                        </HStack>
                    </VStack>

                    {/* Quick Stats Grid */}
                    <HStack className="justify-between bg-background-50 p-4 rounded-3xl border border-outline-50">
                        <VStack className="items-center flex-1">
                            <Icon as={Star} className="text-warning-500 mb-1" size="sm" />
                            <Text size="xs" className="font-bold">{landmark.gmaps_rating}/5</Text>
                            <Text size="xs" className="text-typography-400">Gmaps Rating</Text>
                        </VStack>
                        <Divider orientation='vertical' />
                        <VStack className="items-center flex-1">
                            <Icon as={LocateIcon} className="text-warning-500 mb-1" size="sm" />
                            <Text size="xs" className="font-bold">District {landmark.district}  {landmark.municipality}</Text>
                            <Text size="xs" className="text-typography-400">District / Municipality</Text>
                        </VStack>
                    </HStack>

                    {/* Description */}
                    <VStack className="gap-3">
                        <HStack className="items-center gap-2">
                            <Icon as={Info} size="sm" className="text-primary-600" />
                            <Heading size="md">History & Significance</Heading>
                        </HStack>
                        <Text size="md" className="text-typography-600 leading-7">
                            {"This site holds deep historical significance in the province. It served as a pivotal location during the late 19th century and continues to stand as a testament to the local heritage and resilience of the community."}
                        </Text>
                    </VStack>

                    <Divider className="my-2" />

                    {/* Location Details */}
                    <VStack className="gap-3">
                        <Heading size="md">Exact Location</Heading>
                        <Box className="bg-background-50 p-4 rounded-2xl border border-outline-100">
                            <HStack className="justify-between items-center">
                                <VStack>
                                    <Text size="xs" className="text-typography-400 uppercase font-bold">Coordinates</Text>
                                    <Text size="sm" className="font-mono text-typography-800">
                                        {landmark.latitude.toFixed(6)}, {landmark.longitude.toFixed(6)}
                                    </Text>
                                </VStack>
                            </HStack>
                        </Box>
                    </VStack>
                </VStack>
            </ScrollView>

            {/* Sticky Bottom Action */}
            {
                previewMode ? null : (
                    <Box className="p-6 bg-background-0 border-t border-outline-50">
                        <Button
                            onPress={handleAddToItinerary}
                            size="lg"
                            className="rounded-2xl h-14 bg-primary-600 shadow-soft-2"
                            isDisabled={isPending}
                        >
                            {
                                isPending && <ButtonSpinner />
                            }
                            <ButtonText className="font-bold">
                                {
                                    isPending ? 'Adding...' : 'Add to Itinerary '
                                }
                            </ButtonText>
                        </Button>
                    </Box>
                )
            }
        </Box>
    );
}