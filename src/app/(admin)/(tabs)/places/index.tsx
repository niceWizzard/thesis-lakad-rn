import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import {
    ChevronRight,
    Filter,
    MapPin,
    Plus,
    Search,
    Star, // Added Star icon
    X
} from 'lucide-react-native';
import React, { memo, useMemo, useState } from 'react';
import { Image, RefreshControl, ScrollView, TouchableOpacity } from 'react-native';

import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

import { Badge, BadgeText } from '@/components/ui/badge';
import { Fab, FabIcon, FabLabel } from '@/components/ui/fab';
import ItinerarySkeleton from '@/src/components/ItinerarySkeleton';
import { FilterFormData, LandmarkFilterModal } from '@/src/components/LandmarkFilterModal';
import { useQueryLandmarks } from '@/src/hooks/useQueryLandmarks';

// --- Updated SortKey Type ---
type SortKey = 'id' | 'name' | 'rating';
type SortOrder = 'desc' | 'asc';

const ITEM_HEIGHT = 114; // Approximate height of the item including borders

const LandmarkListItem = memo(({ landmark, onPress }: { landmark: any, onPress: () => void }) => (
    <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        className="bg-background-50 rounded-3xl border border-outline-100 shadow-soft-1 overflow-hidden"
        style={{ height: ITEM_HEIGHT }}
    >
        <HStack className="p-4 items-center gap-4">
            <Box className="w-20 h-20 bg-background-200 rounded-2xl overflow-hidden">
                <Image source={{ uri: landmark.image_url || "https://via.placeholder.com/150" }} className="w-full h-full" resizeMode="cover" />
            </Box>
            <VStack className='flex-1 gap-1'>
                <HStack className="justify-between items-start">
                    <HStack className="flex-wrap gap-1 flex-1">
                        <Badge action="info" variant="outline" className="rounded-md px-1">
                            <BadgeText className="text-[9px] uppercase font-bold">{landmark.type}</BadgeText>
                        </Badge>
                    </HStack>

                    <HStack className="items-center bg-warning-50 px-1.5 py-0.5 rounded-lg border border-warning-100">
                        <Icon as={Star} size='sm' fill="#d97706" color="#d97706" className="mr-1" />
                        <Text size="xs" className="font-bold text-warning-700">{landmark.gmaps_rating ?? '0'}</Text>
                    </HStack>
                </HStack>

                <Heading size="sm" className="text-typography-900" numberOfLines={1}>{landmark.name}</Heading>
                <HStack space="xs" className="items-center">
                    <Icon as={MapPin} size="xs" className="text-typography-400" />
                    <Text size="xs" className="text-typography-500">{landmark.municipality.replace('_', ' ')} - District {landmark.district}</Text>
                </HStack>
            </VStack>
            <Icon as={ChevronRight} className="text-typography-300 mr-1" />
        </HStack>
    </TouchableOpacity>
));

LandmarkListItem.displayName = 'LandmarkListItem';

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
            const matchesType = selectedTypes.length === 0 || selectedTypes.includes(landmark.type);
            const matchesDistrict = !selectedDistrict || landmark.district === selectedDistrict;
            const matchesMuni = !selectedMunicipality || landmark.municipality === selectedMunicipality;

            return matchesSearch && matchesType && matchesDistrict && matchesMuni;
        });

        result.sort((a, b) => {
            let comparison = 0;
            if (sortKey === 'name') {
                comparison = a.name.localeCompare(b.name);
            } else if (sortKey === 'rating') {
                // Sort by gmaps_rating (defaulting to 0 if null/undefined)
                comparison = (a.gmaps_rating ?? 0) - (b.gmaps_rating ?? 0);
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
                    <LandmarkListItem
                        landmark={landmark}
                        onPress={() => router.navigate({ pathname: '/(admin)/landmark/[id]/info/details', params: { id: landmark.id.toString() } })}
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
            <LandmarkFilterModal
                isOpen={showFilterModal}
                onClose={() => setShowFilterModal(false)}
                initialFilters={currentFilters}
                onApply={handleApplyFilters}
            />

            <Fab size="lg" placement="bottom right" onPress={() => router.navigate('/(admin)/landmark/create')} className="bg-primary-600 mb-6 mr-4 shadow-xl">
                <FabIcon as={Plus} />
                <FabLabel className="font-bold">Add New</FabLabel>
            </Fab>
        </Box>
    );
}