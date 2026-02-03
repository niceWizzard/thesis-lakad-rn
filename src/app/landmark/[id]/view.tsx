import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
    AlertCircle,
    ArrowLeft,
    Info,
    LocateIcon,
    MapPin,
    Share2,
    Star,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Share, TouchableOpacity, View } from 'react-native';

import { Badge, BadgeText } from '@/components/ui/badge';
import { Box } from '@/components/ui/box';
import { Button, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

import {
    AlertDialog,
    AlertDialogBackdrop,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
} from '@/components/ui/alert-dialog';
import { Center } from '@/components/ui/center';
import LandmarkSkeleton from '@/src/components/LandmarkSkeleton';
import { useToastNotification } from '@/src/hooks/useToastNotification';
import { useAuthStore } from '@/src/stores/useAuth';
import { createItinerary, fetchItinerariesOfUser } from '@/src/utils/fetchItineraries';
import { fetchLandmarkById } from '@/src/utils/landmark/fetchLandmarks';
import { insertLandmarkToItinerary } from '@/src/utils/landmark/insertLandmark';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export default function LandmarkViewerScreen() {
    const { id, previewMode, itineraryId, currentCount } = useLocalSearchParams();
    const router = useRouter();

    const { showToast } = useToastNotification()
    const queryClient = useQueryClient()

    const { session } = useAuthStore()
    const userId = session?.user.id;
    const [showNoItineraryAlert, setShowNoItineraryAlert] = useState(false);

    const [isCreating, setIsCreating] = React.useState(false);

    const [selectedItinerary, setSelectedItinerary] = useState<{
        id: string;
        name: string;
        stopCount: number;
    } | null>(null);


    const { data: landmark, isError, error, isLoading } = useQuery({
        queryKey: ['landmark', id],
        queryFn: () => fetchLandmarkById(Number.parseInt(id!.toString())),
        enabled: !!id,
    })

    const {
        isPending: isAddingStop,
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
            router.dismissAll()
            router.navigate({
                pathname: '/itinerary/[id]',
                params: { id: itineraryId.toString() },
            })
        },
        onError: (error: any) => {
            showToast({ title: "Error", description: error.message, action: "error" });
        }
    });

    const { data: itineraries, isLoading: isLoadingItineraries } = useQuery({
        queryKey: ['itineraries', userId!],
        queryFn: async () => fetchItinerariesOfUser(userId!),
        enabled: !!userId && showNoItineraryAlert,
    });

    if (isLoading) {
        return <LandmarkSkeleton />
    }

    if (isError || !landmark) {
        return (
            <Box className="flex-1 bg-background-0 items-center justify-center p-6">
                <Stack.Screen options={{ headerShown: false }} />
                <VStack className="items-center gap-4 text-center">
                    <Box className="w-20 h-20 bg-error-50 rounded-full items-center justify-center mb-2">
                        <Icon as={AlertCircle} size="xl" className="text-error-500" />
                    </Box>
                    <Heading size="xl" className="text-center font-bold text-typography-900">
                        {isError ? "Something went wrong" : "Landmark Not Found"}
                    </Heading>
                    <Text className="text-center text-typography-500 mb-4 px-4">
                        {isError
                            ? ((error as any)?.message || "We couldn't load the landmark details. Please try again later.")
                            : "The landmark you're looking for doesn't exist or has been removed."}
                    </Text>
                    <Button
                        onPress={() => router.back()}
                        size="lg"
                        className="rounded-xl px-8 bg-primary-600 shadow-soft-1"
                    >
                        <ButtonText>Go Back</ButtonText>
                    </Button>
                </VStack>
            </Box>
        );
    }

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
            setShowNoItineraryAlert(true);
        }
    }

    const handleAddToNewItinerary = async () => {
        setIsCreating(true); // Start pending state
        try {
            const newId = await createItinerary({
                distance: 0,
                poiIds: [landmark.id],
            });
            queryClient.invalidateQueries({ queryKey: ['itineraries'] });
            router.replace({ pathname: '/itinerary/[id]', params: { id: newId } });
        } catch (e: any) {
            setIsCreating(false); // Reset if failed
            showToast({
                title: "Error",
                description: e.message ?? "Something went wrong.",
                action: "error",
            });
        } finally {
            setIsCreating(false);
        }
    };

    const handleAddToExistingItinerary = async ({ currentCount, name, itineraryId, landmarkId }: {
        itineraryId: string, currentCount: string, landmarkId: string,
        name: string,
    }) => {
        setIsCreating(true)
        try {
            await insertLandmarkToItinerary({
                currentCount,
                itineraryId,
                landmarkId,
            })
            setShowNoItineraryAlert(false);
            showToast({ title: `Added to ${name}`, action: "success" });
            await queryClient.invalidateQueries({ queryKey: ['itinerary', itineraryId] });
            router.dismissAll()
            router.navigate({
                pathname: '/itinerary/[id]',
                params: { id: itineraryId },
            })
        } catch (e: any) {
            showToast({ title: "Error", description: e.message, action: "error" });
        } finally {
            setIsCreating(false)
        }
    }

    const handleConfirmSelection = () => {
        if (!selectedItinerary) return;

        handleAddToExistingItinerary({
            currentCount: selectedItinerary.stopCount.toString(),
            itineraryId: selectedItinerary.id,
            landmarkId: landmark.id.toString(),
            name: selectedItinerary.name
        });
    };



    return (
        <Box className="flex-1 bg-background-0">
            {/* Custom Header Overlays */}
            <Stack.Screen options={{ headerShown: false }} />

            <AlertDialog
                isOpen={showNoItineraryAlert}
                onClose={() => !isAddingStop && !isCreating && setShowNoItineraryAlert(false)}
                size="lg"
            >
                <AlertDialogBackdrop />
                <AlertDialogContent className="max-h-[80%] rounded-[32px]">
                    <AlertDialogHeader className="border-b border-outline-50 p-6">
                        <VStack space="xs">
                            <Heading size="lg">Add to Trip</Heading>
                            <Text size="sm" className="text-typography-500">Select a trip to continue.</Text>
                        </VStack>
                    </AlertDialogHeader>

                    <AlertDialogBody >
                        <View className="px-6 py-4">
                            {isLoadingItineraries ? (
                                <Center className="py-10"><ActivityIndicator color="#0891b2" /></Center>
                            ) : (
                                <VStack space="md">
                                    {itineraries?.map((itinerary) => {
                                        const isSelected = selectedItinerary?.id === itinerary.id.toString();
                                        return (
                                            <Pressable
                                                key={itinerary.id}
                                                disabled={isAddingStop || isCreating}
                                                onPress={() => setSelectedItinerary({
                                                    id: itinerary.id.toString(),
                                                    name: itinerary.name,
                                                    stopCount: itinerary.stops.length || 0
                                                })}
                                            >
                                                <HStack
                                                    className={`justify-between items-center p-4 rounded-2xl border-2 ${isSelected ? 'bg-primary-50 border-primary-500' : 'bg-background-50 border-outline-100'
                                                        } ${(isAddingStop || isCreating) ? 'opacity-50' : ''}`}

                                                >
                                                    <VStack space="xs">
                                                        <Text className={`font-bold ${isSelected ? 'text-primary-700' : 'text-typography-900'}`}>{itinerary.name}</Text>
                                                        <Text size="xs" className="text-typography-500">{itinerary.stops.length} stops</Text>
                                                    </VStack>
                                                    <Box className={`h-5 w-5 rounded-full border-2 items-center justify-center ${isSelected ? 'border-primary-600 bg-primary-600' : 'border-outline-300'}`}>
                                                        {isSelected && <Box className="h-2 w-2 rounded-full bg-white" />}
                                                    </Box>
                                                </HStack>
                                            </Pressable>
                                        );
                                    })}
                                </VStack>
                            )}
                        </View>
                    </AlertDialogBody>

                    <AlertDialogFooter className="border-t border-outline-50 p-6 gap-3">
                        <VStack space="md" className="w-full">
                            {/* Create New Trip Button */}
                            <Button
                                variant="link"
                                action="primary"
                                isDisabled={isAddingStop || isCreating}
                                onPress={handleAddToNewItinerary}
                            >
                                {isCreating ? <ButtonSpinner className="mr-2" /> : null}
                                <ButtonText>{isCreating ? "Creating..." : "+ Create New Itinerary"}</ButtonText>
                            </Button>

                            <HStack space="md">
                                <Button
                                    variant="outline"
                                    action="secondary"
                                    onPress={() => setShowNoItineraryAlert(false)}
                                    className="flex-1 rounded-xl"
                                    isDisabled={isAddingStop || isCreating}
                                >
                                    <ButtonText>Cancel</ButtonText>
                                </Button>

                                {/* Confirm Button */}
                                <Button
                                    action="primary"
                                    isDisabled={!selectedItinerary || isAddingStop || isCreating}
                                    onPress={handleConfirmSelection}
                                    className="flex-1 rounded-xl bg-primary-600"
                                >
                                    {isCreating ? <ButtonSpinner className="mr-2" /> : null}
                                    <ButtonText>{isCreating ? "Adding..." : "Confirm"}</ButtonText>
                                </Button>
                            </HStack>
                        </VStack>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

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
                            {landmark.description ?? "No description available."}
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
                            isDisabled={isAddingStop}
                        >
                            {
                                isAddingStop && <ButtonSpinner />
                            }
                            <ButtonText className="font-bold">
                                {
                                    isAddingStop ? 'Adding...' : 'Add to Itinerary '
                                }
                            </ButtonText>
                        </Button>
                    </Box>
                )
            }
        </Box>
    );
}