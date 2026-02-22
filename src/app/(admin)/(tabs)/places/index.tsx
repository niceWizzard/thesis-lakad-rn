import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import {
    Filter,
    Plus,
    Search, // Added Star icon
    X
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, TouchableOpacity } from 'react-native';

import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

import { Fab, FabIcon, FabLabel } from '@/components/ui/fab';
import ItinerarySkeleton from '@/src/components/ItinerarySkeleton';
import { FilterFormData, PlaceFilterModal } from '@/src/components/PlaceFilterModal';
import { PlaceListItem } from '@/src/components/PlaceListItem';
import { useQueryLandmarks } from '@/src/hooks/useQueryLandmarks';

// --- Updated SortKey Type ---
type SortKey = 'id' | 'name' | 'rating';
type SortOrder = 'desc' | 'asc';


export default function AdminLandmarksScreen() {
    const router = useRouter();

    const [searchString, setSearchString] = useState('');
    const [showFilterModal, setShowFilterModal] = useState(false);

    const [sortKey, setSortKey] = useState<SortKey>('id');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
    const [selectedMunicipality, setSelectedMunicipality] = useState<string | null>(null);

    const currentFilters: FilterFormData = {
        sortKey,
        sortOrder,
        selectedTypes,
        selectedDistrict,
        selectedMunicipality
    };

    const {
        landmarks,
        isLoading,
        isRefetching,
        refetch
    } = useQueryLandmarks()

    // --- ENHANCED FILTERING & SORTING LOGIC ---
    const processedLandmarks = useMemo(() => {
        let result = landmarks.filter(landmark => {
            const matchesSearch = landmark.name.toLowerCase().includes(searchString.toLowerCase());
            const matchesType = selectedTypes.length === 0 || (landmark.type && selectedTypes.includes(landmark.type));
            const matchesDistrict = !selectedDistrict || landmark.district === selectedDistrict;
            const matchesMuni = !selectedMunicipality || landmark.municipality === selectedMunicipality;

            return matchesSearch && matchesType && matchesDistrict && matchesMuni;
        });

        result.sort((a, b) => {
            let comparison = 0;
            if (sortKey === 'name') {
                comparison = a.name.localeCompare(b.name);
            } else if (sortKey === 'rating') {
                comparison = (a.average_rating ?? 0) - (b.average_rating ?? 0);
            } else {
                comparison = a.id - b.id;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [landmarks, searchString, sortKey, sortOrder, selectedTypes, selectedDistrict, selectedMunicipality]);

    const resetFilters = () => {
        setSearchString('');
        setSelectedTypes([]);
        setSelectedDistrict(null);
        setSelectedMunicipality(null);
        setSortKey('id');
        setSortOrder('desc');
    };

    const handleApplyFilters = (data: FilterFormData) => {
        setSortKey(data.sortKey);
        setSortOrder(data.sortOrder);
        setSelectedTypes(data.selectedTypes);
        setSelectedDistrict(data.selectedDistrict);
        setSelectedMunicipality(data.selectedMunicipality);
        setShowFilterModal(false);
    };

    if (isLoading && landmarks.length === 0) {
        return (
            <Box className="flex-1 bg-background-0">

                <ScrollView contentContainerClassName="p-6 gap-6">
                    <Box className="h-12 w-full bg-background-100 rounded-2xl mb-2" />
                    {[1, 2, 3, 4].map((i) => <ItinerarySkeleton key={i} />)}
                </ScrollView>
            </Box>
        );
    }

    return (
        <Box className="flex-1 bg-background-0">
            <FlashList
                data={processedLandmarks}
                keyExtractor={(item) => `landmark-${item.id}`}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 24, paddingBottom: 128 }}
                refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#4f46e5" />}
                ItemSeparatorComponent={() => <Box className="h-4" />}
                ListHeaderComponent={
                    <VStack className="mb-2 gap-4">
                        <Input variant="rounded" size="lg" className="border-none bg-background-100 h-12 rounded-2xl">
                            <InputSlot className="pl-4"><InputIcon as={Search} className="text-typography-400" /></InputSlot>
                            <InputField placeholder="Search name..." value={searchString} onChangeText={setSearchString} />
                            {searchString.length > 0 && (
                                <InputSlot className="pr-4" onPress={() => setSearchString('')}><InputIcon as={X} size="sm" /></InputSlot>
                            )}
                        </Input>

                        <HStack className="justify-between items-center px-1">
                            <VStack>
                                <Text size="xs" className="text-typography-500 font-bold uppercase tracking-wider">
                                    {processedLandmarks.length} Results
                                </Text>
                                {(selectedDistrict || selectedMunicipality || selectedTypes.length > 0) && (
                                    <Text size="xs" className="text-primary-600 font-medium">Filters Active</Text>
                                )}
                            </VStack>
                            <TouchableOpacity
                                onPress={() => setShowFilterModal(true)}
                                className={`flex-row items-center gap-2 px-4 py-2 rounded-full border ${(selectedDistrict || selectedMunicipality || selectedTypes.length > 0)
                                    ? 'bg-primary-600 border-primary-600'
                                    : 'bg-primary-50 border-primary-100'
                                    }`}
                            >
                                <Icon as={Filter} size="xs" color={(selectedDistrict || selectedMunicipality || selectedTypes.length > 0) ? "white" : "#4f46e5"} />
                                <Text size="xs" className={`font-bold ${(selectedDistrict || selectedMunicipality || selectedTypes.length > 0) ? "text-white" : "text-primary-600"}`}>
                                    Filters
                                </Text>
                            </TouchableOpacity>
                        </HStack>
                    </VStack>
                }
                renderItem={({ item: landmark }) => (
                    <PlaceListItem
                        place={landmark}
                        onPress={() => router.navigate({ pathname: '/(admin)/place/[id]/info/details', params: { id: landmark.id.toString() } })}
                    />
                )}
                removeClippedSubviews={true}
                ListEmptyComponent={
                    <VStack className="items-center justify-center py-20 gap-4">
                        <Icon as={Search} size="xl" className="text-typography-200" />
                        <Text className="text-typography-400">No matching landmarks.</Text>
                        <Button variant="link" onPress={resetFilters}><ButtonText>Reset All Filters</ButtonText></Button>
                    </VStack>
                }
            />

            {/* --- FILTER & SORT MODAL --- */}
            <PlaceFilterModal
                isOpen={showFilterModal}
                onClose={() => setShowFilterModal(false)}
                initialFilters={currentFilters}
                onApply={handleApplyFilters}
            />

            <Fab size="lg" placement="bottom right" onPress={() => router.navigate('/(admin)/place/create')} className="bg-primary-600 mb-6 mr-4 shadow-xl">
                <FabIcon as={Plus} />
                <FabLabel className="font-bold">Add New</FabLabel>
            </Fab>
        </Box>
    );
}