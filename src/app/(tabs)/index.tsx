import ImageCreditModal from '@/src/components/ImageCreditModal';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { ChevronRight, Info, MapPin, Star, User } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet } from 'react-native';

// UI Components
import { Badge, BadgeText } from '@/components/ui/badge';
import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

// Custom Components & Stores
import {
    AlertDialog,
    AlertDialogBackdrop,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
} from '@/components/ui/alert-dialog';
import { Center } from '@/components/ui/center';
import { Divider } from '@/components/ui/divider';
import CustomBottomSheet from '@/src/components/CustomBottomSheet';
import LandmarkMapView from '@/src/components/LandmarkMapView';
import { useQueryLandmarks } from '@/src/hooks/useQueryLandmarks';
import useThemeConfig from '@/src/hooks/useThemeConfig';
import { useToastNotification } from '@/src/hooks/useToastNotification';
import { LandmarkWithStats } from '@/src/model/landmark.types';
import { useAuthStore } from '@/src/stores/useAuth';
import { createItinerary, fetchItinerariesOfUser } from '@/src/utils/fetchItineraries';
import { formatTime, getOpeningStatus } from '@/src/utils/landmark/getOpeningStatus';
import { insertLandmarkToItinerary } from '@/src/utils/landmark/insertLandmark';
import { fetchRecentReviewsByLandmarkId } from '@/src/utils/review/fetchReview';
import { supabase } from '@/src/utils/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const ExploreTab = () => {

    const [selectedLandmark, setSelectedLandmark] = useState<LandmarkWithStats | null>(null);
    const [showImageCredits, setShowImageCredits] = useState(false);
    const router = useRouter();
    const camera = useRef<any>(null);
    const { primary } = useThemeConfig()

    const sheetRef = useRef<BottomSheet>(null);
    const [sheetIndex, setSheetIndex] = useState(0)

    // Define snap points: 0 is closed, 1 is the 40% mark
    const snapPoints = useMemo(() => ["30%", "80%",], []);

    const { landmarks } = useQueryLandmarks()

    // Sync selected landmark if landmarks data changes (e.g. review updates rating)
    useEffect(() => {
        if (selectedLandmark && landmarks) {
            const updatedLandmark = landmarks.find(l => l.id === selectedLandmark.id);
            if (updatedLandmark && JSON.stringify(updatedLandmark) !== JSON.stringify(selectedLandmark)) {
                setSelectedLandmark(updatedLandmark);
            }
        }
    }, [landmarks, selectedLandmark]);

    // Add to Itinerary Logic
    const { session } = useAuthStore()
    const userId = session?.user.id;
    const [showNoItineraryAlert, setShowNoItineraryAlert] = useState(false);
    const [pendingAction, setPendingAction] = useState<'create' | 'add' | null>(null);
    const [selectedItinerary, setSelectedItinerary] = useState<{
        id: string;
        name: string;
        stopCount: number;
    } | null>(null);

    const queryClient = useQueryClient();
    const { showToast } = useToastNotification();

    const { data: itineraries, isLoading: isLoadingItineraries } = useQuery({
        queryKey: ['itineraries', userId!],
        queryFn: async () => fetchItinerariesOfUser(userId!),
        enabled: !!userId && showNoItineraryAlert,
    });

    const { data: existingReview, isLoading: isLoadingReview } = useQuery({
        queryKey: ['landmark_review', selectedLandmark?.id?.toString()],
        queryFn: async () => {
            if (!userId || !selectedLandmark?.id) return null;

            const { data } = await supabase
                .from('landmark_reviews')
                .select('*')
                .eq('landmark_id', selectedLandmark.id)
                .eq('user_id', userId)
                .maybeSingle();

            if (!data) return null;

            const publicUrls = (data.images || []).map((img: string) => {
                if (img.includes('supabase.co')) return img;
                return supabase.storage.from('images').getPublicUrl(img).data.publicUrl;
            });

            return {
                ...data,
                images: publicUrls,
            };
        },
        enabled: !!userId && !!selectedLandmark?.id,
    });

    const { data: recentReviews } = useQuery({
        queryKey: ['recent_reviews', selectedLandmark?.id?.toString()],
        queryFn: async () => {
            if (!selectedLandmark?.id) return [];
            return fetchRecentReviewsByLandmarkId(selectedLandmark.id);
        },
        enabled: !!selectedLandmark?.id,
    });

    const handleAddToItinerary = () => {
        setShowNoItineraryAlert(true);
    };

    const handleAddToNewItinerary = async () => {
        if (!selectedLandmark) return;
        setPendingAction('create');
        try {
            const newId = await createItinerary({
                distance: 0,
                poiIds: [selectedLandmark.id],
            });
            queryClient.invalidateQueries({ queryKey: ['itineraries'] });
            setShowNoItineraryAlert(false); // Close the modal
            router.navigate({ pathname: '/itinerary/[id]', params: { id: newId } });
            setSelectedLandmark(null); // Close sheet
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

    const handleConfirmSelection = async () => {
        if (!selectedItinerary || !selectedLandmark) return;
        setPendingAction('add');
        try {
            await insertLandmarkToItinerary({
                currentCount: selectedItinerary.stopCount.toString(),
                itineraryId: selectedItinerary.id,
                landmarkId: selectedLandmark.id.toString(),
            });
            setShowNoItineraryAlert(false);
            showToast({ title: `Added to ${selectedItinerary.name}`, action: "success" });
            await queryClient.invalidateQueries({ queryKey: ['itinerary', selectedItinerary.id] });

            router.navigate({
                pathname: '/itinerary/[id]',
                params: { id: selectedItinerary.id },
            });
            setSelectedLandmark(null);
        } catch (e: any) {
            showToast({ title: "Error", description: e.message, action: "error" });
        } finally {
            setSelectedItinerary(null)
            setPendingAction(null);
        }
    };

    // Sync BottomSheet with selectedLandmark state
    useEffect(() => {
        if (selectedLandmark?.id) {
            // Use requestAnimationFrame to ensure the sheet is ready
            requestAnimationFrame(() => {
                sheetRef.current?.snapToIndex(0);
            });
        } else {
            sheetRef.current?.close();
        }
    }, [selectedLandmark?.id]);

    // 2. Removed local location Effect

    const handleBackdropPress = () => {
        setSelectedLandmark(null)
    }




    return (
        <Box className="flex-1 bg-background-0">
            <AlertDialog
                isOpen={showNoItineraryAlert}
                onClose={() => !pendingAction && setShowNoItineraryAlert(false)}
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
                        <Box className="px-6 py-4">
                            {isLoadingItineraries ? (
                                <Center className="py-10"><ActivityIndicator color="#0891b2" /></Center>
                            ) : (
                                <VStack space="md">
                                    {itineraries?.map((itinerary) => {
                                        const isSelected = selectedItinerary?.id === itinerary.id.toString();
                                        return (
                                            <Pressable
                                                key={itinerary.id}
                                                disabled={!!pendingAction || itinerary.stops.length >= 50}
                                                onPress={() => setSelectedItinerary({
                                                    id: itinerary.id.toString(),
                                                    name: itinerary.name,
                                                    stopCount: itinerary.stops.length || 0
                                                })}
                                            >
                                                <HStack
                                                    className={`justify-between items-center p-4 rounded-2xl border-2 ${isSelected ? 'bg-primary-50 border-primary-500' : 'bg-background-50 border-outline-100'
                                                        } ${(!!pendingAction || itinerary.stops.length >= 50) ? 'opacity-50' : ''}`}

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
                        </Box>
                    </AlertDialogBody>

                    <AlertDialogFooter className="border-t border-outline-50 p-6 gap-3">
                        <VStack space="md" className="w-full">
                            {/* Create New Trip Button */}
                            <Button
                                variant="link"
                                action="primary"
                                isDisabled={!!pendingAction}
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
                                    isDisabled={!!pendingAction}
                                >
                                    <ButtonText>Cancel</ButtonText>
                                </Button>

                                {/* Confirm Button */}
                                <Button
                                    action="primary"
                                    isDisabled={!selectedItinerary || !!pendingAction}
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
            <LandmarkMapView
                cameraRef={camera}
                selectedLandmark={selectedLandmark}
                setSelectedLandmark={setSelectedLandmark}
                landmarks={landmarks}
            />

            <CustomBottomSheet
                onChange={(index) => setSheetIndex(index)}
                bottomSheetRef={sheetRef}
                isBottomSheetOpened={!!selectedLandmark}
                snapPoints={snapPoints}
                enablePanDownToClose
                onClose={handleBackdropPress}
            >

                <BottomSheetScrollView
                    contentContainerStyle={styles.scrollContent}
                >
                    <Pressable onPress={() => {
                        sheetRef.current?.snapToIndex(
                            sheetIndex === 0 ? 1 : 0
                        );
                    }}>
                        {selectedLandmark ? (
                            <VStack className="gap-6">
                                {/* Drag Indicator */}
                                <Box className='w-full items-center pt-2 pb-1'>
                                    <Box className='w-12 h-1 bg-outline-300 rounded-full' />
                                </Box>
                                {/* Header Info */}
                                <VStack className="gap-2">
                                    <HStack className="justify-between items-start gap-2" >
                                        <VStack className="flex-1 pr-4">
                                            <Heading size="xl" className="text-typography-900 leading-tight">
                                                {selectedLandmark.name}
                                            </Heading>
                                            <HStack space="xs" className="mt-1 items-center">
                                                <Icon as={MapPin} size="xs" className="text-primary-600" />
                                                <Text size="sm" className="text-typography-500 font-medium">
                                                    {selectedLandmark.municipality}, District {selectedLandmark.district}
                                                </Text>
                                            </HStack>
                                        </VStack>
                                        <HStack className="items-center bg-warning-50 px-3 py-1.5 rounded-2xl border border-warning-100">
                                            <Icon as={Star} size="xs" className="text-warning-600 mr-1" fill="#d97706" />
                                            <Text size="sm" className="font-bold text-warning-700">
                                                {selectedLandmark.gmaps_rating?.toFixed(1) ?? '0.0'}
                                            </Text>
                                        </HStack>
                                        <HStack className="items-center px-3 py-1.5 rounded-2xl border border-primary-100">
                                            <Icon as={Star} size="xs" className="text-primary-600 mr-1" fill="#059669" />
                                            <Text size="sm" className="font-bold text-primary-700">
                                                {selectedLandmark.average_rating?.toFixed(1) ?? '0.0'}
                                            </Text>
                                        </HStack>
                                    </HStack>

                                    <HStack space="xs" className="flex-wrap mt-1">
                                        <Badge
                                            action="info" variant="solid" className="rounded-lg bg-primary-50 border-none">
                                            <BadgeText className="text-[10px] text-primary-700 uppercase font-bold">{selectedLandmark.type}</BadgeText>
                                        </Badge>
                                    </HStack>
                                </VStack>

                                {/* Image Section */}
                                <Box className="relative">
                                    <Image
                                        source={{ uri: selectedLandmark.image_url || "https://via.placeholder.com/600x400" }}
                                        className="w-full h-56 rounded-[32px] bg-background-100"
                                        resizeMode="cover"
                                    />
                                    <Pressable
                                        className="absolute top-4 right-4 bg-black/40 p-2 rounded-full backdrop-blur-md"
                                        onPress={() => setShowImageCredits(true)}
                                    >
                                        <Icon as={Info} size="sm" className="text-white" />
                                    </Pressable>
                                </Box>

                                {/* Description */}
                                <VStack space="xs" className='gap-3'>
                                    <Text size="sm" className="font-bold text-typography-900 uppercase tracking-wider">About</Text>
                                    <Box className="bg-background-50 p-4 rounded-2xl border border-outline-50">
                                        <Text size="sm" className="text-typography-600 leading-relaxed">
                                            {selectedLandmark.description || "This site holds deep historical significance in the province. It served as a pivotal location during the late 19th century and continues to stand as a testament to the local heritage and resilience of the community."}
                                        </Text>
                                    </Box>

                                    {/* Opening Hours */}
                                    {(selectedLandmark.type as string) !== 'Pasalubong Center' && selectedLandmark.landmark_opening_hours && selectedLandmark.landmark_opening_hours.length > 0 && (
                                        <VStack space="xs">
                                            <HStack className="justify-between items-center">
                                                <Text size="sm" className="font-bold text-typography-900 uppercase tracking-wider">Opening Hours</Text>
                                                {(() => {
                                                    const status = getOpeningStatus(selectedLandmark.landmark_opening_hours!);
                                                    const colorMap = {
                                                        'success': 'bg-success-100 text-success-700 border-success-200',
                                                        'error': 'bg-error-100 text-error-700 border-error-200',
                                                        'warning': 'bg-warning-100 text-warning-700 border-warning-200',
                                                        'info': 'bg-info-100 text-info-700 border-info-200'
                                                    };
                                                    return (
                                                        <Box className={`px-2 py-0.5 rounded-lg border ${colorMap[status.color] || 'bg-background-100 text-typography-500'}`}>
                                                            <Text size="xs" className={`font-bold ${colorMap[status.color].split(' ')[1]}`}>
                                                                {status.status}
                                                            </Text>
                                                        </Box>
                                                    );
                                                })()}
                                            </HStack>

                                            <Box className="bg-background-50 p-4 rounded-2xl border border-outline-50">
                                                <VStack space="sm" className='gap-2'>
                                                    {selectedLandmark.landmark_opening_hours
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
                                                                <HStack key={`${hour.landmark_id}-${hour.day_of_week}`} className="justify-between items-center">
                                                                    <Text size="sm" className={`font-medium w-24 ${isToday ? "text-primary-600 font-bold" : "text-typography-600"}`}>
                                                                        {days[hour.day_of_week]} {isToday && "(Today)"}
                                                                    </Text>
                                                                    <Text size="sm" className={hour.is_closed ? "text-error-600 font-medium" : "text-typography-900"}>
                                                                        {hour.is_closed ? 'Closed' : `${formatTime(hour.opens_at)} - ${formatTime(hour.closes_at)}`}
                                                                    </Text>
                                                                </HStack>
                                                            );
                                                        })}
                                                </VStack>
                                            </Box>
                                        </VStack>
                                    )}


                                    {/* Actions */}
                                    {(selectedLandmark.type as string) !== 'Pasalubong Center' && (
                                        <VStack className="pb-10 gap-6">
                                            <HStack space="md">
                                                <Button
                                                    variant="outline"
                                                    className="flex-1 rounded-2xl h-14 border-outline-200 bg-background-50"
                                                    onPress={() => {
                                                        router.navigate({
                                                            pathname: '/landmark/[id]/view',
                                                            params: {
                                                                id: selectedLandmark.id.toString(),
                                                            },
                                                        });
                                                    }}
                                                >
                                                    <ButtonIcon as={Info} className="mr-2 text-typography-900" />
                                                    <ButtonText className="font-bold text-typography-900">Details</ButtonText>
                                                </Button>

                                                <Button
                                                    className="flex-[2] rounded-2xl h-14 bg-primary-600 shadow-soft-2"
                                                    onPress={handleAddToItinerary}
                                                >
                                                    <ButtonIcon as={MapPin} className="mr-2" />
                                                    <ButtonText className="font-bold">Add to Itinerary</ButtonText>
                                                </Button>
                                            </HStack>

                                            {/* Make a Review Section */}
                                            <VStack space="sm" className="bg-background-50 p-4 rounded-2xl border border-outline-100">
                                                <HStack className="justify-between items-center mb-1">
                                                    <Text size="sm" className="font-bold text-typography-900 uppercase tracking-wider">
                                                        {isLoadingReview ? "Loading..." : existingReview ? "Your Review" : "Make a Review"}
                                                    </Text>
                                                </HStack>

                                                {existingReview && existingReview.content ? (
                                                    <Text size="sm" className="text-typography-600 mb-2" numberOfLines={3} ellipsizeMode="tail">
                                                        {existingReview.content.length > 150 ? `${existingReview.content.substring(0, 150)}...` : existingReview.content}
                                                    </Text>
                                                ) : null}

                                                {existingReview?.images && existingReview.images.length > 0 && (
                                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                                                        <HStack space="md">
                                                            {existingReview.images.map((uri: string, index: number) => (
                                                                <Image
                                                                    key={index}
                                                                    source={{ uri }}
                                                                    className="w-16 h-16 rounded-xl border border-outline-100 bg-background-100"
                                                                />
                                                            ))}
                                                        </HStack>
                                                    </ScrollView>
                                                )}

                                                <HStack className="justify-between items-center">
                                                    {/* 5 Stars Button */}
                                                    <Pressable
                                                        className="flex-row gap-1 py-1 px-1 rounded-xl justify-center items-center"
                                                        onPress={() => {
                                                            router.navigate({
                                                                pathname: '/landmark/[id]/review',
                                                                params: { id: selectedLandmark.id.toString() }
                                                            });
                                                        }}
                                                    >
                                                        {isLoadingReview ? (
                                                            <ActivityIndicator size="small" color="#0891b2" />
                                                        ) : existingReview ? (
                                                            [1, 2, 3, 4, 5].map((star) => (
                                                                <Star
                                                                    key={`filled-star-${star}`}
                                                                    size={16}
                                                                    color={star <= (existingReview.rating ?? 0) ? primary['500'] : "#d4d4d4"}
                                                                    fill={star <= (existingReview.rating ?? 0) ? primary['500'] : "none"}
                                                                />
                                                            ))
                                                        ) : (
                                                            [1, 2, 3, 4, 5].map((star) => (
                                                                <Icon
                                                                    key={`star-${star}`}
                                                                    as={Star}
                                                                    size='lg'
                                                                />
                                                            ))
                                                        )}
                                                        <Text className="font-bold ml-1">{existingReview?.rating ?? 0}</Text>
                                                    </Pressable>

                                                    {/* Add Review Button */}
                                                    <Button
                                                        variant="link"
                                                        className="h-10"
                                                        onPress={() => {
                                                            router.navigate({
                                                                pathname: '/landmark/[id]/review',
                                                                params: { id: selectedLandmark.id.toString() }
                                                            });
                                                        }}
                                                    >
                                                        <ButtonText className="text-primary-600 font-bold">
                                                            {isLoadingReview ? "Loading..." : existingReview ? "Edit review" : "Write a review"}
                                                        </ButtonText>
                                                    </Button>
                                                </HStack>
                                            </VStack>

                                            {/* Recent Reviews Section */}
                                            {recentReviews && recentReviews.length > 0 && (
                                                <>
                                                    <Box className="flex-row items-center my-2 opacity-50">
                                                        <Box className="flex-1 h-[1px] bg-outline-200" />
                                                        <Text size="xs" className="mx-3 text-typography-400 font-medium tracking-widest uppercase">Community</Text>
                                                        <Box className="flex-1 h-[1px] bg-outline-200" />
                                                    </Box>
                                                    <VStack space="sm" className="bg-background-50 p-4 rounded-2xl border border-outline-100">
                                                        <HStack className="justify-between items-center mb-2">
                                                            <Text size="sm" className="font-bold text-typography-900 uppercase tracking-wider">
                                                                Recent Reviews
                                                            </Text>
                                                            <Badge variant="outline" action="muted" className="rounded-full px-2 py-0 border-outline-200 bg-background-0">
                                                                <BadgeText className="text-[10px] text-typography-500 font-medium">
                                                                    {selectedLandmark.review_count} {selectedLandmark.review_count === 1 ? 'Review' : 'Reviews'}
                                                                </BadgeText>
                                                            </Badge>
                                                        </HStack>
                                                        <VStack space="md" className="gap-4">
                                                            {recentReviews.map((review, index) => (
                                                                <VStack
                                                                    key={review.id}
                                                                    className='gap-4'
                                                                >
                                                                    <Pressable
                                                                        onPress={() => {
                                                                            if (review.user_id === userId) {
                                                                                router.navigate({
                                                                                    pathname: '/landmark/[id]/review' as any,
                                                                                    params: { id: selectedLandmark.id.toString() },
                                                                                });

                                                                            } else {
                                                                                router.navigate({
                                                                                    pathname: '/landmark/[id]/review/[reviewId]' as any,
                                                                                    params: { id: selectedLandmark.id.toString(), reviewId: review.id.toString() },
                                                                                });
                                                                            }
                                                                        }}
                                                                        className='active:bg-background-100 p-3 rounded-xl'
                                                                    >
                                                                        <VStack space="sm" className="border-b border-outline-100 pb-3 last:border-b-0 last:pb-0">
                                                                            <HStack className="justify-between items-center mb-1">
                                                                                <HStack className="items-center gap-2">
                                                                                    <Box className="w-6 h-6 rounded-full bg-primary-100 items-center justify-center">
                                                                                        <Icon as={User} size="xs" className="text-primary-600" />
                                                                                    </Box>
                                                                                    <Text size="sm" className="font-medium text-typography-900 truncate max-w-[120px]" numberOfLines={1}>
                                                                                        {review.author_name || 'Lakbay User'}
                                                                                        {review.user_id === userId && '(You)'}
                                                                                    </Text>
                                                                                </HStack>
                                                                                <HStack space="xs">
                                                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                                                        <Star
                                                                                            key={star}
                                                                                            size={12}
                                                                                            color={star <= (review.rating ?? 0) ? primary['500'] : "#d4d4d4"}
                                                                                            fill={star <= (review.rating ?? 0) ? primary['500'] : "none"}
                                                                                        />
                                                                                    ))}
                                                                                </HStack>
                                                                                <Icon as={ChevronRight} size="sm" className="text-typography-500" />
                                                                            </HStack>
                                                                            {review.content ? (
                                                                                <Text size="sm" className="text-typography-600 mt-1" numberOfLines={3} ellipsizeMode="tail">
                                                                                    {review.content}
                                                                                </Text>
                                                                            ) : null}
                                                                            {review.images && review.images.length > 0 && (
                                                                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
                                                                                    <HStack space="md">
                                                                                        {review.images.map((uri: string, imgIdx: number) => (
                                                                                            <Image
                                                                                                key={imgIdx}
                                                                                                source={{ uri }}
                                                                                                className="size-24 rounded-xl border border-outline-100 bg-background-100"
                                                                                            />
                                                                                        ))}
                                                                                    </HStack>
                                                                                </ScrollView>
                                                                            )}

                                                                        </VStack>
                                                                    </Pressable>
                                                                    {
                                                                        index < recentReviews.length - 1 && (
                                                                            <Divider />
                                                                        )
                                                                    }
                                                                </VStack>
                                                            ))}
                                                        </VStack>

                                                        <Button
                                                            variant="link"
                                                            className="h-10 mt-2"
                                                            onPress={() => {
                                                                router.navigate({
                                                                    pathname: '/landmark/[id]/review/all',
                                                                    params: { id: selectedLandmark.id.toString() }
                                                                });
                                                            }}
                                                        >
                                                            <ButtonText className="text-primary-600 font-bold">
                                                                See all reviews
                                                            </ButtonText>
                                                        </Button>
                                                    </VStack>
                                                </>
                                            )}
                                        </VStack>
                                    )}
                                </VStack>
                            </VStack>
                        ) : (
                            <Box className="flex-1 justify-center items-center p-10">
                                <Text className="text-typography-400 italic text-center">
                                    Select a marker on the map to see details
                                </Text>
                            </Box>
                        )}
                    </Pressable>
                </BottomSheetScrollView>
            </CustomBottomSheet>
            <ImageCreditModal
                isOpen={showImageCredits}
                onClose={() => setShowImageCredits(false)}
                credits={selectedLandmark?.image_credits}
            />
        </Box >
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
});

export default ExploreTab;