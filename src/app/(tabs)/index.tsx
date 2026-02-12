import ImageCreditModal from '@/src/components/ImageCreditModal';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { Info, MapPin, Star } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet } from 'react-native';

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
import CustomBottomSheet from '@/src/components/CustomBottomSheet';
import LandmarkMapView from '@/src/components/LandmarkMapView';
import { useQueryCombinedLandmarks } from '@/src/hooks/useQueryCombinedLandmarks';
import { useToastNotification } from '@/src/hooks/useToastNotification';
import { Landmark } from '@/src/model/landmark.types';
import { useAuthStore } from '@/src/stores/useAuth';
import { createItinerary, fetchItinerariesOfUser } from '@/src/utils/fetchItineraries';
import { insertLandmarkToItinerary } from '@/src/utils/landmark/insertLandmark';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const ExploreTab = () => {

    const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);
    const [showImageCredits, setShowImageCredits] = useState(false);
    const router = useRouter();
    const camera = useRef<any>(null);

    const sheetRef = useRef<BottomSheet>(null);
    const [sheetIndex, setSheetIndex] = useState(0)

    // Define snap points: 0 is closed, 1 is the 40% mark
    const snapPoints = useMemo(() => ["20%", "80%",], []);

    const { landmarks } = useQueryCombinedLandmarks()

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
            setPendingAction(null);
        }
    };

    // Sync BottomSheet with selectedLandmark state
    useEffect(() => {
        if (selectedLandmark) {
            // Use requestAnimationFrame to ensure the sheet is ready
            requestAnimationFrame(() => {
                sheetRef.current?.snapToIndex(0);
            });
        } else {
            sheetRef.current?.close();
        }
    }, [selectedLandmark]);

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
                                    <HStack className="justify-between items-start">
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
                                    </HStack>

                                    <HStack space="xs" className="flex-wrap mt-1">
                                        {selectedLandmark.creation_type === 'COMMERCIAL' ? (
                                            <Badge
                                                action="muted" variant="solid" className="rounded-lg bg-background-100 border border-outline-100">
                                                <BadgeText className="text-[10px] text-typography-600 uppercase font-bold">Commercial</BadgeText>
                                            </Badge>
                                        ) : (
                                            <Badge
                                                action="info" variant="solid" className="rounded-lg bg-primary-50 border-none">
                                                <BadgeText className="text-[10px] text-primary-700 uppercase font-bold">{selectedLandmark.type}</BadgeText>
                                            </Badge>
                                        )}
                                    </HStack>
                                </VStack>

                                {
                                    sheetIndex > 0 && (
                                        <>
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
                                            <VStack space="xs">
                                                <Text size="sm" className="font-bold text-typography-900 uppercase tracking-wider">About</Text>
                                                <Box className="bg-background-50 p-4 rounded-2xl border border-outline-50">
                                                    <Text size="sm" className="text-typography-600 leading-relaxed">
                                                        {selectedLandmark.description || "This site holds deep historical significance in the province. It served as a pivotal location during the late 19th century and continues to stand as a testament to the local heritage and resilience of the community."}
                                                    </Text>
                                                </Box>
                                            </VStack>

                                            {/* Actions */}
                                            {selectedLandmark.creation_type !== 'COMMERCIAL' && (
                                                <HStack space="md" className="pb-10">
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
                                            )}
                                        </>
                                    )
                                }
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