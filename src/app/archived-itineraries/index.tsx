import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Modal, ModalBackdrop, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@/components/ui/modal';
import { Progress, ProgressFilledTrack } from '@/components/ui/progress';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import ItinerarySkeleton from '@/src/components/ItinerarySkeleton';
import { useToastNotification } from '@/src/hooks/useToastNotification';
import { ItineraryWithStops } from '@/src/model/itinerary.types';
import { useAuthStore } from '@/src/stores/useAuth';
import { deleteAllArchivedItineraries, fetchArchivedItineraries, permanentlyDeleteItinerary, restoreItinerary } from '@/src/utils/fetchItineraries';
import { formatDate } from '@/src/utils/format/date';
import { formatDistance } from '@/src/utils/format/distance';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { AlertTriangle, ArchiveRestore, MapPin, Ruler, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';

export default function ArchivedItinerariesScreen() {
    const auth = useAuthStore();
    const userId = auth.session?.user?.id;
    const { showToast } = useToastNotification();
    const queryClient = useQueryClient();

    const [restoringId, setRestoringId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeletingAll, setIsDeletingAll] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<ItineraryWithStops | null>(null);
    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

    const isProcessing = !!restoringId || isDeleting || isDeletingAll;

    const {
        data: itineraries = [],
        isLoading,
        isRefetching,
        refetch
    } = useQuery<ItineraryWithStops[]>({
        queryKey: ['archived_itineraries', userId],
        queryFn: () => fetchArchivedItineraries(userId!),
        enabled: !!userId,
    });

    useEffect(() => {
        if (isLoading) return;
        if (itineraries.length === 0) {
            return;
        }
        // filter itineraries that are older than 7 days
        const deleteRequests = itineraries.filter(v => (new Date().getTime() - (new Date(v.deleted_at!).getTime())) > 7 * 24 * 60 * 60 * 1000).map(v => permanentlyDeleteItinerary(v.id))
        Promise.all(deleteRequests)
    }, [isLoading, itineraries])

    const calculateProgress = (itinerary: ItineraryWithStops) => {
        if (!itinerary.stops?.length) return 0;
        const completed = itinerary.stops.filter(stop => !!stop.visited_at).length;
        return (completed / itinerary.stops.length) * 100;
    };

    const handleRestore = async (id: number) => {
        setRestoringId(id);
        try {
            await restoreItinerary(id);
            showToast({
                title: "Itinerary restored",
                description: "It is now back in your main list.",
            });
            refetch();
            queryClient.invalidateQueries({ queryKey: ['itineraries'] });
        } catch (e: any) {
            showToast({
                title: "Error restoring itinerary",
                description: e.message,
                action: 'error',
            });
        } finally {
            setRestoringId(null);
        }
    };

    const confirmPermanentDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        try {
            await permanentlyDeleteItinerary(itemToDelete.id);
            showToast({
                title: "Itinerary permanently deleted",
            });
            setItemToDelete(null);
            refetch();
        } catch (e: any) {
            showToast({
                title: "Error deleting itinerary",
                description: e.message,
                action: 'error',
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteAll = async () => {
        if (!userId) return;
        setIsDeletingAll(true);
        try {
            await deleteAllArchivedItineraries(userId);
            showToast({
                title: "All archived itineraries deleted",
            });
            setShowDeleteAllModal(false);
            refetch();
        } catch (e: any) {
            showToast({
                title: "Error deleting all itineraries",
                description: e.message,
                action: 'error',
            });
        } finally {
            setIsDeletingAll(false);
        }
    };

    // --- 1. LOADING STATE ---
    const isInitialLoading = !userId || (isLoading && itineraries.length === 0);

    if (isInitialLoading) {
        return (
            <Box className="flex-1 bg-background-0 p-6 gap-6">
                <Stack.Screen options={{ headerTitle: "Archived Trips", headerShown: true }} />
                <Box className="h-12 w-full bg-background-100 rounded-2xl mb-2" />
                {[1, 2, 3].map((i) => <ItinerarySkeleton key={i} />)}
            </Box>
        );
    }

    // --- 2. EMPTY STATE (No Itineraries at all) ---
    if (!isLoading && itineraries.length === 0) {
        return (
            <Box className="flex-1 bg-background-0 justify-center items-center p-10">
                <Stack.Screen options={{ headerTitle: "Archived Trips", headerShown: true }} />
                <Box className="bg-primary-50 p-6 rounded-full mb-6">
                    <Icon as={Trash2} size="xl" className="text-primary-600" />
                </Box>
                <Heading size="xl" className="text-center mb-2">No Archived Trips</Heading>
                <Text className="text-center text-typography-500 mb-8">
                    Your deleted itineraries will show up here.
                </Text>
            </Box>
        );
    }

    return (
        <Box className="flex-1 bg-background-0">
            <Stack.Screen options={{ headerTitle: "Archived Trips", headerShown: true }} />
            <FlatList
                ListHeaderComponent={
                    <VStack className="mb-6 gap-4">
                        <Box className="bg-warning-50 p-4 rounded-3xl border border-warning-200">
                            <HStack className="items-start gap-3">
                                <Icon as={AlertTriangle} className="text-warning-600 mt-1" />
                                <VStack className="flex-1">
                                    <Heading size="sm" className="text-warning-900 mb-1">Auto-deletion Notice</Heading>
                                    <Text size="sm" className="text-warning-700">
                                        Archived itineraries will be permanently deleted 7 days after they were moved to the archive.
                                    </Text>
                                </VStack>
                            </HStack>
                        </Box>

                        <Button
                            size="md"
                            action="negative"
                            onPress={() => setShowDeleteAllModal(true)}
                            isDisabled={isProcessing || itineraries.length === 0}
                            className='rounded-2xl'
                        >
                            <ButtonIcon as={Trash2} className="mr-2" />
                            <ButtonText >Delete All</ButtonText>
                        </Button>
                    </VStack>
                }
                data={itineraries}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerClassName="p-6 pb-32 gap-6"
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={refetch}
                        tintColor="#4f46e5"
                    />
                }
                renderItem={({ item: itinerary }) => {
                    const progress = calculateProgress(itinerary);

                    return (
                        <View className="p-5 rounded-3xl  bg-background-50 border border-outline-100 shadow-soft-1 overflow-hidden opacity-80">
                            <HStack className="justify-between items-start mb-4">
                                <VStack className="flex-1 pr-4">
                                    <Text size="xs" className="uppercase font-bold text-typography-500 tracking-wider mb-1">
                                        Deleted: {itinerary.deleted_at ? formatDate(itinerary.deleted_at) : 'Unknown'}
                                    </Text>
                                    <Heading size="lg" className="text-typography-900 leading-tight mb-2">
                                        {itinerary.name}
                                    </Heading>
                                    <HStack className="items-center gap-3">
                                        <HStack className="items-center gap-1.5">
                                            <Icon as={MapPin} size="xs" className="text-primary-600" />
                                            <Text size="xs" className="font-bold text-typography-600">
                                                {itinerary.stops?.length || 0} Stops
                                            </Text>
                                        </HStack>
                                        <Box className="w-1 h-1 rounded-full bg-typography-300" />
                                        <HStack className="items-center gap-1.5">
                                            <Icon as={Ruler} size="xs" className="text-primary-600" />
                                            <Text size="xs" className="font-bold text-typography-600">
                                                {formatDistance(itinerary.distance)}
                                            </Text>
                                        </HStack>
                                    </HStack>
                                </VStack>
                            </HStack>

                            <VStack className="gap-2 mb-6">
                                <HStack className="justify-between items-end">
                                    <Text size="sm" className="text-typography-500 font-medium">Progress at deletion</Text>
                                    <Text size="sm" className="text-typography-900 font-bold">{Math.round(progress)}%</Text>
                                </HStack>
                                <Progress value={progress} className="h-2 bg-background-100 rounded-full">
                                    <ProgressFilledTrack className={"bg-typography-400"} />
                                </Progress>
                            </VStack>

                            <HStack space="md" className="flex-wrap">
                                <Button
                                    variant="outline"
                                    action="secondary"
                                    onPress={() => handleRestore(itinerary.id)}
                                    isDisabled={isProcessing}
                                    className="rounded-2xl border-outline-200 flex-shrink"
                                >
                                    {restoringId === itinerary.id ? (
                                        <ButtonSpinner color={'$typography500'} />
                                    ) : (
                                        <ButtonIcon as={ArchiveRestore} />
                                    )}
                                    <ButtonText>
                                        {restoringId === itinerary.id ? "Restoring..." : "Restore"}
                                    </ButtonText>
                                </Button>
                                <Button
                                    action="negative"
                                    variant="solid"
                                    onPress={() => setItemToDelete(itinerary)}
                                    isDisabled={isProcessing}
                                    className="rounded-2xl flex-shrink"
                                >
                                    <ButtonIcon as={Trash2} />
                                    <ButtonText>
                                        Delete Forever
                                    </ButtonText>
                                </Button>
                            </HStack>
                        </View>
                    );
                }}
            />
            {/* Permanent Delete Confirmation Modal */}
            <Modal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                size="md"
            >
                <ModalBackdrop />
                <ModalContent className="rounded-3xl p-4">
                    <ModalHeader>
                        <Heading size="lg" className="text-typography-950">Confirm Permanent Delete</Heading>
                    </ModalHeader>
                    <ModalBody>
                        <Text className="text-typography-500">
                            Are you sure you want to permanently delete <Text className="font-bold text-typography-900">&quot;{itemToDelete?.name}&quot;</Text>? This action CANNOT be undone.
                        </Text>
                    </ModalBody>
                    <ModalFooter className="gap-3">
                        <Button variant="outline" action="secondary" className="flex-1 rounded-2xl" onPress={() => setItemToDelete(null)}>
                            <ButtonText>Cancel</ButtonText>
                        </Button>
                        <Button action="negative" className="flex-1 rounded-2xl" onPress={confirmPermanentDelete} isDisabled={isProcessing}>
                            {isDeleting && <ButtonSpinner color={'white'} className="mr-2" />}
                            <ButtonText>{isDeleting ? "Deleting..." : "Delete Forever"}</ButtonText>
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Delete All Confirmation Modal */}
            <Modal
                isOpen={showDeleteAllModal}
                onClose={() => setShowDeleteAllModal(false)}
                size="md"
            >
                <ModalBackdrop />
                <ModalContent className="rounded-3xl p-4">
                    <ModalHeader>
                        <Heading size="lg" className="text-typography-950">Delete All Archived Itineraries?</Heading>
                    </ModalHeader>
                    <ModalBody>
                        <Text className="text-typography-500">
                            Are you sure you want to permanently delete <Text className="font-bold text-typography-900">ALL</Text> archived itineraries? This action CANNOT be undone.
                        </Text>
                    </ModalBody>
                    <ModalFooter className="gap-3">
                        <Button variant="outline" action="secondary" className="flex-1 rounded-2xl" onPress={() => setShowDeleteAllModal(false)}>
                            <ButtonText>Cancel</ButtonText>
                        </Button>
                        <Button action="negative" className="flex-1 rounded-2xl" onPress={handleDeleteAll} isDisabled={isProcessing}>
                            {isDeletingAll && <ButtonSpinner color={'white'} className="mr-2" />}
                            <ButtonText>{isDeletingAll ? "Deleting..." : "Delete All"}</ButtonText>
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}
