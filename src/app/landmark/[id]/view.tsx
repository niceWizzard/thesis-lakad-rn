import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
    AlertCircle,
    ArrowLeft,
    Info,
    MapPin,
    Share2,
    Star,
    StarHalf
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
import ImageCreditModal from '@/src/components/ImageCreditModal';
import LandmarkSkeleton from '@/src/components/LandmarkSkeleton';
import useThemeConfig from '@/src/hooks/useThemeConfig';
import { useToastNotification } from '@/src/hooks/useToastNotification';
import { useAuthStore } from '@/src/stores/useAuth';
import { createItinerary, fetchItinerariesOfUser } from '@/src/utils/fetchItineraries';
import { fetchLandmarkById } from '@/src/utils/landmark/fetchLandmarks';
import { formatTime } from '@/src/utils/landmark/getOpeningStatus';
import { insertPlaceToItinerary } from '@/src/utils/landmark/insertLandmark';
import { supabase } from '@/src/utils/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export default function LandmarkViewerScreen() {
    const searchParams = useLocalSearchParams();
    const { id, previewMode, itineraryId, currentCount } = searchParams;
    const currentCountNum = Number(currentCount || 0);
    const router = useRouter();
    const [showImageCredits, setShowImageCredits] = useState(false);

    const { showToast } = useToastNotification()
    const queryClient = useQueryClient()

    const { session } = useAuthStore()
    const userId = session?.user.id;
    const [showNoItineraryAlert, setShowNoItineraryAlert] = useState(false);
    const { primary } = useThemeConfig()

    const [pendingAction, setPendingAction] = useState<'create' | 'add' | null>(null);

    const [selectedItinerary, setSelectedItinerary] = useState<{
        id: string;
        name: string;
        stopCount: number;
    } | null>(null);


    const { data: landmark, isError, error, isLoading } = useQuery({
        queryKey: ['landmark', id],
        queryFn: () => {
            return fetchLandmarkById(Number.parseInt(id!.toString()));
        },
        enabled: !!id,
    })

    const {
        isPending: isAddingStop,
        mutate: addStopMutation
    } = useMutation({
        mutationFn: async (placeId: number) => {
            if (currentCountNum >= 50) {
                throw new Error("Itinerary limit reached (50 stops max)");
            }
            return insertPlaceToItinerary({
                currentCount: currentCount.toString(),
                itineraryId: itineraryId.toString(),
                placeId: placeId.toString(),
            });
        },
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

    const { data: existingReview } = useQuery({
        queryKey: ['landmark_review', id],
        queryFn: async () => {
            if (!userId || !id) return null;
            const { data, error } = await supabase
                .from('reviews')
                .select('*')
                .eq('place_id', Number(id))
                .eq('user_id', userId)
                .maybeSingle();

            if (error) {
                console.error("Error fetching review:", error);
                return null;
            }
            return data;
        },
        enabled: !!userId && !!id,
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
            setSelectedItinerary(null)
            setShowNoItineraryAlert(true);
        }
    }

    const handleAddToNewItinerary = async () => {
        setPendingAction('create'); // Start pending state
        try {
            const newId = await createItinerary({
                distance: 0,
                poiIds: [landmark.id],
            });
            setShowNoItineraryAlert(false); // Close the modal
            await queryClient.invalidateQueries({ queryKey: ['itineraries'] });
            router.replace({ pathname: '/itinerary/[id]', params: { id: newId } });
        } catch (e: any) {
            showToast({
                title: "Error",
                description: e.message ?? "Something went wrong.",
                action: "error",
            });
        } finally {
            setPendingAction(null);
        }
    };

    const handleAddToExistingItinerary = async ({ currentCount, name, itineraryId, placeId }: {
        itineraryId: string, currentCount: string, placeId: string,
        name: string,
    }) => {
        setPendingAction('add')
        try {
            if (Number(currentCount) >= 50) {
                throw new Error("Itinerary limit reached (50 stops max)");
            }

            await insertPlaceToItinerary({
                currentCount,
                itineraryId,
                placeId,
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
            setPendingAction(null)
        }
    }

    const handleConfirmSelection = () => {
        if (!selectedItinerary) return;

        handleAddToExistingItinerary({
            currentCount: selectedItinerary.stopCount.toString(),
            itineraryId: selectedItinerary.id,
            placeId: landmark.id.toString(),
            name: selectedItinerary.name
        });
    };



    return (
        <Box className="flex-1 bg-background-0">
            {/* Custom Header Overlays */}
            <Stack.Screen options={{ headerShown: false }} />

            <AlertDialog
                isOpen={showNoItineraryAlert}
                onClose={() => !isAddingStop && !pendingAction && setShowNoItineraryAlert(false)}
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
                                                disabled={isAddingStop || !!pendingAction || itinerary.stops.length >= 50}
                                                onPress={() => setSelectedItinerary({
                                                    id: itinerary.id.toString(),
                                                    name: itinerary.name,
                                                    stopCount: itinerary.stops.length || 0
                                                })}
                                            >
                                                <HStack
                                                    className={`justify-between items-center p-4 rounded-2xl border-2 ${isSelected ? 'bg-primary-50 border-primary-500' : 'bg-background-50 border-outline-100'
                                                        } ${(isAddingStop || !!pendingAction || itinerary.stops.length >= 50) ? 'opacity-50' : ''}`}

                                                >
                                                    <VStack space="xs">
                                                        <Text className={`font-bold ${isSelected ? 'text-primary-700' : 'text-typography-900'}`}>{itinerary.name}</Text>
                                                        <Text size="xs" className="text-typography-500">{itinerary.stops.length} stops {itinerary.stops.length >= 50 ? '(Full)' : ''}</Text>
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
                                isDisabled={isAddingStop || !!pendingAction}
                                onPress={handleAddToNewItinerary}
                            >
                                {pendingAction === 'create' ? <ButtonSpinner className="mr-2" /> : null}
                                <ButtonText>{pendingAction === 'create' ? "Creating..." : "+ Create New Itinerary"}</ButtonText>
                            </Button>

                            <HStack space="md">
                                <Button
                                    variant="outline"
                                    action="secondary"
                                    onPress={() => setShowNoItineraryAlert(false)}
                                    className="flex-1 rounded-xl"
                                    isDisabled={isAddingStop || !!pendingAction}
                                >
                                    <ButtonText>Cancel</ButtonText>
                                </Button>

                                {/* Confirm Button */}
                                <Button
                                    action="primary"
                                    isDisabled={!selectedItinerary || isAddingStop || !!pendingAction}
                                    onPress={handleConfirmSelection}
                                    className="flex-1 rounded-xl bg-primary-600"
                                >
                                    {pendingAction === 'add' ? <ButtonSpinner className="mr-2" /> : null}
                                    <ButtonText>{pendingAction === 'add' ? "Adding..." : "Confirm"}</ButtonText>
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

                        <HStack space="sm">
                            <TouchableOpacity
                                onPress={() => setShowImageCredits(true)}
                                className="bg-black/30 p-2 rounded-full"
                            >
                                <Icon as={Info} size="md" className="text-white" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleShare}
                                className="bg-black/30 p-2 rounded-full"
                            >
                                <Share2 color="white" size={24} />
                            </TouchableOpacity>
                        </HStack>
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
                                District {landmark.district} • {landmark.municipality}, Bulacan
                            </Text>
                        </HStack>
                    </VStack>

                    {/* Ratings Section */}
                    <VStack className="bg-background-50 p-4 rounded-3xl border border-outline-50 gap-4">
                        {/* Lakad Rating Row */}
                        <HStack className="justify-between items-center">
                            <VStack>
                                <Text size="md" className="font-bold text-typography-900">Lakad Rating</Text>
                                <Text size="sm" className="text-typography-500">Based on user reviews</Text>
                            </VStack>
                            <VStack className="items-end">
                                <HStack space="xs" className="mb-1">
                                    {[1, 2, 3, 4, 5].map((star) => {
                                        const avg = landmark.average_rating || 0;
                                        const isFilled = star <= avg;
                                        const isHalf = !isFilled && star - 0.5 <= avg;

                                        if (isHalf) {
                                            return (
                                                <Box key={star} className="relative w-4 h-4 justify-center items-center">
                                                    <Star
                                                        size={16}
                                                        color={primary['200']}
                                                        fill="transparent"
                                                    />
                                                    <Box className="absolute top-0 left-0 bottom-0 right-0 justify-center items-center">
                                                        <StarHalf
                                                            size={16}
                                                            color={primary['500']}
                                                            fill={primary['500']}
                                                        />
                                                    </Box>
                                                </Box>
                                            );
                                        }

                                        return (
                                            <Star
                                                key={star}
                                                size={16}
                                                color={isFilled ? primary['500'] : primary['200']}
                                                fill={isFilled ? primary['500'] : "transparent"}
                                            />
                                        );
                                    })}
                                </HStack>
                                <Text size="sm" className="font-bold text-primary-600">
                                    {landmark.average_rating ? landmark.average_rating.toFixed(1) + " / 5.0" : "New"}
                                </Text>
                            </VStack>
                        </HStack>
                    </VStack>

                    {/* Description */}
                    <VStack className="gap-3">
                        <HStack className="items-center gap-2">
                            <Icon as={Info} size="sm" className="text-primary-600" />
                            <Heading size="md">About</Heading>
                        </HStack>
                        <Text size="md" className="text-typography-600 leading-7">
                            {landmark.description ?? "No description available."}
                        </Text>
                    </VStack>

                    <Divider className="my-2" />

                    {/* Lakad Reviews Action */}
                    <VStack className="bg-background-50 p-4 rounded-2xl gap-3">
                        <HStack className="justify-between items-center">
                            <VStack className="flex-1 mr-4 gap-1">
                                <Heading size="md">Lakad Reviews</Heading>
                                <Text size="sm" className="text-typography-500">
                                    {landmark.review_count ? `Based on ${landmark.review_count} review(s)` : 'No reviews yet. Be the first!'}
                                </Text>
                            </VStack>
                            <Button
                                size="sm"
                                action="primary"
                                variant={existingReview ? "outline" : "solid"}
                                className="rounded-xl px-4"
                                onPress={() => router.push({ pathname: '/landmark/[id]/review', params: { id: landmark.id.toString() } })}
                            >
                                <ButtonText>{existingReview ? "Edit Your Review" : "Write a Review"}</ButtonText>
                            </Button>
                        </HStack>

                        {landmark.review_count > 0 && (
                            <Button
                                variant="link"
                                size="sm"
                                className="h-8 self-start -ml-1"
                                onPress={() => router.push({ pathname: '/landmark/[id]/review/all' as any, params: { id: landmark.id.toString() } })}
                            >
                                <ButtonText className="text-primary-600 font-semibold">See all reviews →</ButtonText>
                            </Button>
                        )}
                    </VStack>

                    <Divider className="my-2" />

                    <Box className="bg-background-50 p-4 rounded-2xl border border-outline-50">
                        <Heading size="md">Opening Hours</Heading>
                        <VStack space="sm" className='gap-2'>
                            {
                                landmark.opening_hours?.length ? (
                                    landmark.opening_hours
                                        .sort((a, b) => {
                                            const dayA = a.day_of_week === 0 ? 7 : a.day_of_week;
                                            const dayB = b.day_of_week === 0 ? 7 : b.day_of_week;
                                            return dayA - dayB;
                                        })
                                        .map((hour) => {
                                            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                                            // Highlight today
                                            const isToday = hour.day_of_week === new Date().getDay();

                                            return (
                                                <HStack key={`${hour.place_id}-${hour.day_of_week}`} className="justify-between items-center">
                                                    <Text size="sm" className={`font-medium w-24 ${isToday ? "text-primary-600 font-bold" : "text-typography-600"}`}>
                                                        {days[hour.day_of_week]} {isToday && "(Today)"}
                                                    </Text>
                                                    <Text size="sm" className={hour.is_closed ? "text-error-600 font-medium" : "text-typography-900"}>
                                                        {hour.is_closed ? 'Closed' : `${formatTime(hour.opens_at!)} - ${formatTime(hour.closes_at!)}`}
                                                    </Text>
                                                </HStack>
                                            );
                                        })
                                ) : (
                                    <Text>No opening hours available. </Text>
                                )
                            }
                        </VStack>
                    </Box>


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
                </VStack >
            </ScrollView >

            {/* Sticky Bottom Action */}
            {
                previewMode ? null : (
                    <Box className="p-6 bg-background-0 border-t border-outline-50">
                        <Button
                            onPress={handleAddToItinerary}
                            size="lg"
                            className="rounded-2xl h-14 bg-primary-600 shadow-soft-2"
                            isDisabled={isAddingStop || (!!itineraryId && currentCountNum >= 50)}
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
            <ImageCreditModal
                isOpen={showImageCredits}
                onClose={() => setShowImageCredits(false)}
                credits={landmark.image_credits}
            />
        </Box >
    );
}