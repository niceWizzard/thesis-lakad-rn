import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import { ArrowUpDown, ClipboardList, Search, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl } from 'react-native';

import { Actionsheet, ActionsheetBackdrop, ActionsheetContent, ActionsheetDragIndicator, ActionsheetDragIndicatorWrapper, ActionsheetItem, ActionsheetItemText } from '@/components/ui/actionsheet';
import { AlertDialog, AlertDialogBackdrop, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader } from '@/components/ui/alert-dialog';
import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

import ExpandableFab from '@/src/components/ExpandableFAB';
import { ItineraryItem } from '@/src/components/ItineraryItem';
import ItinerarySkeleton from '@/src/components/ItinerarySkeleton';
import { useToastNotification } from '@/src/hooks/useToastNotification';
import { ItineraryWithStops } from '@/src/model/itinerary.types';
import { useAuthStore } from '@/src/stores/useAuth';
import { fetchItinerariesOfUser } from '@/src/utils/fetchItineraries';
import { supabase } from '@/src/utils/supabase';
import { useQuery } from '@tanstack/react-query';

export default function ItinerariesScreen() {
    const [searchString, setSearchString] = useState('');
    const auth = useAuthStore();
    const userId = auth.session?.user?.id;
    const router = useRouter();
    const [showActionsheet, setShowActionsheet] = useState(false);
    const [sortOption, setSortOption] = useState<'date' | 'name' | 'stops'>('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const { showToast } = useToastNotification();
    const [showAlertDialog, setShowAlertDialog] = useState(false);
    const [itineraryToDelete, setItineraryToDelete] = useState<number | null>(null);

    const {
        data: itineraries = [],
        isLoading,
        isRefetching,
        refetch
    } = useQuery<ItineraryWithStops[]>({
        queryKey: ['itineraries', userId],
        queryFn: () => fetchItinerariesOfUser(userId!),
        enabled: !!userId,
    });

    // Memoize filtered data for performance
    const filteredItineraries = useMemo(() => {
        let result = itineraries.filter(v =>
            v.name.toLowerCase().includes(searchString.toLowerCase())
        );

        return result.sort((a, b) => {
            let comparison = 0;
            switch (sortOption) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'stops':
                    comparison = (a.stops?.length || 0) - (b.stops?.length || 0);
                    break;
                case 'date':
                default:
                    comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                    break;
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [itineraries, searchString, sortOption, sortDirection]);

    const handleSort = (option: 'date' | 'name' | 'stops', direction: 'asc' | 'desc') => {
        setSortOption(option);
        setSortDirection(direction);
        setShowActionsheet(false);
    };



    const handlePress = (id: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.navigate({ pathname: '/itinerary/[id]', params: { id } });
    };

    const confirmDelete = async () => {
        if (!itineraryToDelete) return;

        try {
            const { error } = await supabase
                .from('itinerary')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', itineraryToDelete);

            if (error) throw error;

            showToast({
                title: "Itinerary moved to trash",
                description: "You can restore it from Archived Itineraries.",
            })

            await refetch();
        } catch (error) {
            console.error('Error deleting itinerary:', error);
            showToast({
                title: "Error deleting itinerary",
                description: "Please try again. " + (error as Error).message,
            })
        } finally {
            setShowAlertDialog(false);
            setItineraryToDelete(null);
        }
    }

    const deleteItinerary = (id: number) => {
        setItineraryToDelete(id);
        setShowAlertDialog(true);
    }

    // --- 1. LOADING STATE ---
    if (isLoading && itineraries.length === 0) {
        return (
            <Box className="flex-1 bg-background-0 p-6 gap-6">
                <Stack.Screen options={{ headerTitle: "My Trips" }} />
                <Box className="h-12 w-full bg-background-100 rounded-2xl mb-2" />
                {[1, 2, 3].map((i) => <ItinerarySkeleton key={i} />)}
            </Box>
        );
    }

    // --- 2. EMPTY STATE (No Itineraries at all) ---
    if (!isLoading && itineraries.length === 0) {
        return (
            <Box className="flex-1 bg-background-0 justify-center items-center p-10">
                <Stack.Screen options={{ headerTitle: "My Trips" }} />
                <Box className="bg-primary-50 p-6 rounded-full mb-6">
                    <Icon as={ClipboardList} size="xl" className="text-primary-600" />
                </Box>
                <Heading size="xl" className="text-center mb-2">No Trips Found</Heading>
                <Text className="text-center text-typography-500 mb-8">
                    Start exploring and create your first walking itinerary!
                </Text>
                <ExpandableFab />
            </Box>
        );
    }

    return (
        <Box className="flex-1 bg-background-0">
            <Stack.Screen options={{ headerTitle: "My Trips" }} />
            <FlatList
                data={filteredItineraries}
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
                ListHeaderComponent={
                    <VStack className="mb-2">
                        <HStack className="gap-3">
                            <Input variant="rounded" size="lg" className="flex-1 border-none bg-background-100 h-14 rounded-2xl px-4">
                                <InputSlot>
                                    <InputIcon as={Search} className="text-typography-400" />
                                </InputSlot>
                                <InputField
                                    placeholder="Search your trips..."
                                    value={searchString}
                                    onChangeText={setSearchString}
                                    className="text-typography-900"
                                />
                                {searchString.length > 0 && (
                                    <InputSlot onPress={() => setSearchString('')}>
                                        <Icon as={X} size="sm" className="text-typography-400" />
                                    </InputSlot>
                                )}
                            </Input>
                            <Button
                                size="lg"
                                className="h-14 w-14 rounded-2xl p-0"
                                onPress={() => setShowActionsheet(true)}
                                variant='outline'
                                action='secondary'
                            >
                                <ButtonIcon as={ArrowUpDown} className="text-typography-500" />
                            </Button>
                        </HStack>
                    </VStack>
                }
                ListEmptyComponent={
                    <VStack className="items-center py-20">
                        <Text className="text-typography-400 italic">No trips match your search.</Text>
                    </VStack>
                }
                renderItem={({ item: itinerary }) => (
                    <ItineraryItem
                        itinerary={itinerary}
                        onPress={handlePress}
                        onInfoPress={(id) => {
                            router.navigate({
                                pathname: '/itinerary/[id]/info',
                                params: { id },
                            });
                        }}
                        onDeletePress={(id) => {
                            deleteItinerary(id);
                        }}
                    />
                )}
            />

            <ExpandableFab />

            <Actionsheet isOpen={showActionsheet} onClose={() => setShowActionsheet(false)} snapPoints={[50]}>
                <ActionsheetBackdrop />
                <ActionsheetContent>
                    <ActionsheetDragIndicatorWrapper>
                        <ActionsheetDragIndicator />
                    </ActionsheetDragIndicatorWrapper>
                    <Heading size="md" className="mb-4 text-typography-500 uppercase tracking-widest text-center">Sort By</Heading>

                    <ActionsheetItem onPress={() => handleSort('date', 'desc')}>
                        <ActionsheetItemText className={sortOption === 'date' && sortDirection === 'desc' ? 'font-bold text-primary-600' : ''}>
                            Date (Newest First)
                        </ActionsheetItemText>
                    </ActionsheetItem>
                    <ActionsheetItem onPress={() => handleSort('date', 'asc')}>
                        <ActionsheetItemText className={sortOption === 'date' && sortDirection === 'asc' ? 'font-bold text-primary-600' : ''}>
                            Date (Oldest First)
                        </ActionsheetItemText>
                    </ActionsheetItem>

                    <ActionsheetItem onPress={() => handleSort('name', 'asc')}>
                        <ActionsheetItemText className={sortOption === 'name' && sortDirection === 'asc' ? 'font-bold text-primary-600' : ''}>
                            Name (A-Z)
                        </ActionsheetItemText>
                    </ActionsheetItem>
                    <ActionsheetItem onPress={() => handleSort('name', 'desc')}>
                        <ActionsheetItemText className={sortOption === 'name' && sortDirection === 'desc' ? 'font-bold text-primary-600' : ''}>
                            Name (Z-A)
                        </ActionsheetItemText>
                    </ActionsheetItem>

                    <ActionsheetItem onPress={() => handleSort('stops', 'desc')}>
                        <ActionsheetItemText className={sortOption === 'stops' && sortDirection === 'desc' ? 'font-bold text-primary-600' : ''}>
                            Stops (Most First)
                        </ActionsheetItemText>
                    </ActionsheetItem>
                    <ActionsheetItem onPress={() => handleSort('stops', 'asc')}>
                        <ActionsheetItemText className={sortOption === 'stops' && sortDirection === 'asc' ? 'font-bold text-primary-600' : ''}>
                            Stops (Least First)
                        </ActionsheetItemText>
                    </ActionsheetItem>
                </ActionsheetContent>
            </Actionsheet>

            <AlertDialog
                isOpen={showAlertDialog}
                onClose={() => {
                    setShowAlertDialog(false);
                    setItineraryToDelete(null);
                }}
            >
                <AlertDialogBackdrop />
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <Heading size="md" className="text-typography-950">
                            Delete Itinerary
                        </Heading>
                    </AlertDialogHeader>
                    <AlertDialogBody className="mt-3 mb-4">
                        <Text size="sm">
                            Are you sure you want to move this itinerary to trash?
                        </Text>
                    </AlertDialogBody>
                    <AlertDialogFooter className="">
                        <Button
                            variant="outline"
                            action="secondary"
                            onPress={() => {
                                setShowAlertDialog(false);
                                setItineraryToDelete(null);
                            }}
                            size="sm"
                        >
                            <ButtonText>Cancel</ButtonText>
                        </Button>
                        <Button
                            size="sm"
                            action="negative"
                            onPress={confirmDelete}
                        >
                            <ButtonText>Delete</ButtonText>
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Box>
    );
}