import { useRouter } from 'expo-router';
import {
    ArrowDown,
    ArrowUp,
    Clock,
    Filter,
    Map as MapIcon,
    Plus,
    Search,
    SortAsc,
    Star, // Added Star icon
    X
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';

import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import {
    Modal,
    ModalBackdrop,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader
} from '@/components/ui/modal';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

import { Fab, FabIcon, FabLabel } from '@/components/ui/fab';
import ItinerarySkeleton from '@/src/components/ItinerarySkeleton';
import { PlaceListItem } from '@/src/components/PlaceListItem';
import { DISTRICT_TO_MUNICIPALITY_MAP } from '@/src/constants/jurisdictions';
import { useQueryUnverifiedPlaces } from '@/src/hooks/useQueryUnverified';
import { PlaceDistrict } from '@/src/model/places.types';

// --- Updated SortKey Type ---
type SortKey = 'id' | 'name' | 'rating';
type SortOrder = 'asc' | 'desc';

export default function AdminPasalubongCenterScreens() {
    const router = useRouter();

    const [searchString, setSearchString] = useState('');
    const [showFilterModal, setShowFilterModal] = useState(false);

    const [sortKey, setSortKey] = useState<SortKey>('id');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
    const [selectedMunicipality, setSelectedMunicipality] = useState<string | null>(null);


    const {
        landmarks,
        isLoading,
        isRefetching,
        refetch
    } = useQueryUnverifiedPlaces()

    // --- ENHANCED FILTERING & SORTING LOGIC ---
    const processedLandmarks = useMemo(() => {
        let result = landmarks.filter(landmark => {
            const matchesSearch = landmark.name.toLowerCase().includes(searchString.toLowerCase());
            const matchesDistrict = !selectedDistrict || landmark.district === selectedDistrict;
            const matchesMuni = !selectedMunicipality || landmark.municipality === selectedMunicipality;

            return matchesSearch && matchesDistrict && matchesMuni;
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
    }, [landmarks, searchString, sortKey, sortOrder, selectedDistrict, selectedMunicipality]);

    const resetFilters = () => {
        setSearchString('');
        setSelectedDistrict(null);
        setSelectedMunicipality(null);
        setSortKey('id');
        setSortOrder('desc');
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


            <FlatList
                data={processedLandmarks}
                keyExtractor={(item) => `landmark-${item.id}`}
                showsVerticalScrollIndicator={false}
                contentContainerClassName="p-6 pb-32 gap-4"
                refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#4f46e5" />}
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
                                {(selectedDistrict || selectedMunicipality) && (
                                    <Text size="xs" className="text-primary-600 font-medium">Filters Active</Text>
                                )}
                            </VStack>
                            <TouchableOpacity
                                onPress={() => setShowFilterModal(true)}
                                className={`flex-row items-center gap-2 px-4 py-2 rounded-full border ${(selectedDistrict || selectedMunicipality)
                                    ? 'bg-primary-600 border-primary-600'
                                    : 'bg-primary-50 border-primary-100'
                                    }`}
                            >
                                <Icon as={Filter} size="xs" color={(selectedDistrict || selectedMunicipality) ? "white" : "#4f46e5"} />
                                <Text size="xs" className={`font-bold ${(selectedDistrict || selectedMunicipality) ? "text-white" : "text-primary-600"}`}>
                                    Filters
                                </Text>
                            </TouchableOpacity>
                        </HStack>
                    </VStack>
                }
                renderItem={({ item: landmark }) => (
                    <PlaceListItem
                        place={landmark}
                        onPress={() => router.navigate({
                            pathname: '/(admin)/place/[id]/info/details',
                            params: { id: landmark.id.toString() }
                        })}
                    />
                )}
                ListEmptyComponent={
                    <VStack className="items-center justify-center py-20 gap-4">
                        <Icon as={Search} size="xl" className="text-typography-200" />
                        <Text className="text-typography-400">No matching landmarks.</Text>
                        <Button variant="link" onPress={resetFilters}><ButtonText>Reset All Filters</ButtonText></Button>
                    </VStack>
                }
            />

            {/* --- FILTER & SORT MODAL --- */}
            <Modal isOpen={showFilterModal} onClose={() => setShowFilterModal(false)}>
                <ModalBackdrop />
                <ModalContent className="rounded-[32px] max-h-[90%]">
                    <ModalHeader className="p-4 border-b border-outline-50">
                        <VStack>
                            <Heading size="lg">Refine List</Heading>
                            <Text size="xs" className="text-typography-500">Apply sorting and geographic filters</Text>
                        </VStack>
                        <ModalCloseButton><Icon as={X} /></ModalCloseButton>
                    </ModalHeader>
                    <ModalBody>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <VStack className="p-4 gap-8">
                                {/* 1. Sort Section */}
                                <VStack className='gap-3'>
                                    <Text size="xs" className="font-bold text-typography-500 uppercase tracking-widest">Sort By</Text>
                                    <HStack className='gap-2'>
                                        <Button
                                            className={`flex-1 rounded-xl h-11 ${sortKey === 'id' ? 'bg-primary-600' : 'bg-background-100'}`}
                                            onPress={() => setSortKey('id')}
                                        >
                                            <ButtonIcon as={Clock} color={sortKey === 'id' ? 'white' : '#6b7280'} />
                                            <ButtonText className={sortKey === 'id' ? 'text-white' : 'text-typography-600'}>Recent</ButtonText>
                                        </Button>
                                        <Button
                                            className={`flex-1 rounded-xl h-11 ${sortKey === 'name' ? 'bg-primary-600' : 'bg-background-100'}`}
                                            onPress={() => setSortKey('name')}
                                        >
                                            <ButtonIcon as={SortAsc} color={sortKey === 'name' ? 'white' : '#6b7280'} />
                                            <ButtonText className={sortKey === 'name' ? 'text-white' : 'text-typography-600'}>A-Z</ButtonText>
                                        </Button>

                                        {/* --- New Rating Sort Button --- */}
                                        <Button
                                            className={`flex-1 rounded-xl h-11 ${sortKey === 'rating' ? 'bg-primary-600' : 'bg-background-100'}`}
                                            onPress={() => setSortKey('rating')}
                                        >
                                            <ButtonIcon as={Star} color={sortKey === 'rating' ? 'white' : '#6b7280'} />
                                            <ButtonText className={sortKey === 'rating' ? 'text-white' : 'text-typography-600'}>Rating</ButtonText>
                                        </Button>
                                    </HStack>
                                    <HStack className='gap-2'>
                                        <Button variant="outline" className={`flex-1 rounded-xl h-11 ${sortOrder === 'asc' ? 'border-primary-600 bg-primary-50' : 'border-outline-100'}`} onPress={() => setSortOrder('asc')}>
                                            <ButtonIcon as={ArrowUp} className="text-primary-600" /><ButtonText className="text-primary-700 font-bold">Asc</ButtonText>
                                        </Button>
                                        <Button variant="outline" className={`flex-1 rounded-xl h-11 ${sortOrder === 'desc' ? 'border-primary-600 bg-primary-50' : 'border-outline-100'}`} onPress={() => setSortOrder('desc')}>
                                            <ButtonIcon as={ArrowDown} className="text-primary-600" /><ButtonText className="text-primary-700 font-bold">Desc</ButtonText>
                                        </Button>
                                    </HStack>
                                </VStack>

                                {/* 2. Jurisdiction Filter */}
                                <VStack className='gap-3'>
                                    <HStack className="items-center gap-2">
                                        <Icon as={MapIcon} size="xs" className="text-typography-500" />
                                        <Text size="xs" className="font-bold text-typography-500 uppercase tracking-widest">Jurisdiction</Text>
                                    </HStack>
                                    <VStack className="gap-2">
                                        <Text size="xs" className="font-bold text-typography-400">DISTRICT</Text>
                                        <HStack className="gap-2 flex-wrap">
                                            <TouchableOpacity
                                                onPress={() => { setSelectedDistrict(null); setSelectedMunicipality(null); }}
                                                className={`px-4 py-2 rounded-xl border ${!selectedDistrict ? 'bg-primary-600 border-primary-600' : 'bg-background-50 border-outline-200'}`}
                                            >
                                                <Text className={`text-xs font-bold ${!selectedDistrict ? 'text-white' : 'text-typography-600'}`}>All</Text>
                                            </TouchableOpacity>
                                            {Object.keys(DISTRICT_TO_MUNICIPALITY_MAP).map(dist => (
                                                <TouchableOpacity
                                                    key={dist}
                                                    onPress={() => { setSelectedDistrict(dist); setSelectedMunicipality(null); }}
                                                    className={`px-4 py-2 rounded-xl border mr-2 ${selectedDistrict === dist ? 'bg-primary-600 border-primary-600' : 'bg-background-50 border-outline-200'}`}
                                                >
                                                    <Text className={`text-xs font-bold ${selectedDistrict === dist ? 'text-white' : 'text-typography-600'}`}>D-{dist}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </HStack>
                                    </VStack>

                                    {selectedDistrict && (
                                        <VStack className="gap-2 mt-2">
                                            <Text size="xs" className="font-bold text-typography-400">MUNICIPALITY</Text>
                                            <View className="flex-row flex-wrap gap-2">
                                                {DISTRICT_TO_MUNICIPALITY_MAP[selectedDistrict as PlaceDistrict].map(muni => (
                                                    <TouchableOpacity
                                                        key={muni}
                                                        onPress={() => setSelectedMunicipality(prev => prev === muni ? null : muni)}
                                                        className={`px-3 py-1.5 rounded-lg border ${selectedMunicipality === muni ? 'bg-secondary-500 border-secondary-500' : 'bg-background-50 border-outline-200'}`}
                                                    >
                                                        <Text className={`text-[11px] font-bold ${selectedMunicipality === muni ? 'text-white' : 'text-typography-600'}`}>
                                                            {muni.replace('_', ' ')}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </VStack>
                                    )}
                                </VStack>
                            </VStack>
                        </ScrollView>
                    </ModalBody>
                    <ModalFooter className="p-4 border-t border-outline-50">
                        <HStack space="md" className="w-full">
                            <Button variant="outline" action="secondary" className="flex-1 rounded-2xl h-12" onPress={resetFilters}>
                                <ButtonText>Clear All</ButtonText>
                            </Button>
                            <Button onPress={() => setShowFilterModal(false)} className="flex-[2] rounded-2xl h-12 bg-primary-600">
                                <ButtonText className="font-bold">Apply Filters</ButtonText>
                            </Button>
                        </HStack>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <Fab size="lg" placement="bottom right" onPress={() => router.navigate('/(admin)/place/create')} className="bg-primary-600 mb-6 mr-4 shadow-xl">
                <FabIcon as={Plus} />
                <FabLabel className="font-bold">Add New</FabLabel>
            </Fab>
        </Box>
    );
}