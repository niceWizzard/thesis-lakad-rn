import { Stack, useRouter } from 'expo-router';
import {
    ArrowDown,
    ArrowUp,
    Check,
    ChevronRight,
    Clock,
    Filter,
    Plus,
    Search,
    SortAsc,
    X
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { FlatList, Image, RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';

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

import { Badge, BadgeText } from '@/components/ui/badge';
import { Fab, FabIcon, FabLabel } from '@/components/ui/fab';
import ItinerarySkeleton from '@/src/components/ItinerarySkeleton';
import { Landmark } from '@/src/model/landmark.types';
import { useAuthStore } from '@/src/stores/useAuth';
import { fetchLandmarks } from '@/src/utils/fetchLandmarks';
import { useQuery } from '@tanstack/react-query';

type SortKey = 'id' | 'name';
type SortOrder = 'asc' | 'desc';
const CATEGORIES = ['Historical', 'Nature', 'Food', 'Culture'];

export default function AdminLandmarksScreen() {
    const [searchString, setSearchString] = useState('');
    const [showFilterModal, setShowFilterModal] = useState(false);

    // Sort & Filter State
    const [sortKey, setSortKey] = useState<SortKey>('id');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    const auth = useAuthStore();
    const userId = auth.session?.user?.id;
    const router = useRouter();

    const {
        data: landmarks = [],
        isLoading,
        isRefetching,
        refetch
    } = useQuery<Landmark[]>({
        queryKey: ['landmarks'],
        queryFn: fetchLandmarks,
        enabled: !!userId,
    });

    // --- ENHANCED FILTERING & SORTING ---
    const processedLandmarks = useMemo(() => {
        let result = landmarks.filter(landmark => {
            const matchesSearch = landmark.name.toLowerCase().includes(searchString.toLowerCase());
            // Assuming your landmark model has a 'category' field
            const matchesCategory = selectedCategories.length === 0 || selectedCategories.every(v => landmark.categories.includes(v as any));
            return matchesSearch && matchesCategory;
        });

        result.sort((a, b) => {
            let comparison = 0;
            if (sortKey === 'name') {
                comparison = a.name.localeCompare(b.name);
            } else {
                comparison = a.id - b.id;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [landmarks, searchString, sortKey, sortOrder, selectedCategories]);

    const toggleCategory = (cat: string) => {
        setSelectedCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    const handleCreatePress = () => router.navigate('/(admin)/landmark/create');

    if (isLoading && landmarks.length === 0) {
        return (
            <Box className="flex-1 bg-background-0">
                <Stack.Screen options={{ headerTitle: "Manage Content" }} />
                <ScrollView contentContainerClassName="p-6 gap-6">
                    <Box className="h-12 w-full bg-background-100 rounded-2xl mb-2" />
                    {[1, 2, 3, 4].map((i) => <ItinerarySkeleton key={i} />)}
                </ScrollView>
            </Box>
        );
    }

    return (
        <Box className="flex-1 bg-background-0">
            <Stack.Screen options={{ headerTitle: "Manage Landmarks" }} />

            <FlatList
                data={processedLandmarks}
                keyExtractor={(item) => `landmark-${item.id}`}
                showsVerticalScrollIndicator={false}
                contentContainerClassName="p-6 pb-32 gap-4"
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#4f46e5" />
                }
                ListHeaderComponent={
                    <VStack className="mb-2 gap-4">
                        <Input variant="rounded" size="lg" className="border-none bg-background-100 h-12 rounded-2xl">
                            <InputSlot className="pl-4">
                                <InputIcon as={Search} className="text-typography-400" />
                            </InputSlot>
                            <InputField
                                placeholder="Search landmarks..."
                                value={searchString}
                                onChangeText={setSearchString}
                            />
                            {searchString.length > 0 && (
                                <InputSlot className="pr-4" onPress={() => setSearchString('')}>
                                    <InputIcon as={X} size="sm" />
                                </InputSlot>
                            )}
                        </Input>

                        <HStack className="justify-between items-center px-1">
                            <Text size="xs" className="text-typography-500 font-bold uppercase tracking-wider">
                                {processedLandmarks.length} Results
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowFilterModal(true)}
                                className="flex-row items-center gap-2 bg-primary-50 px-4 py-2 rounded-full border border-primary-100"
                            >
                                <Icon as={Filter} size="xs" className="text-primary-600" />
                                <Text size="xs" className="text-primary-600 font-bold">Filters & Sort</Text>
                            </TouchableOpacity>
                        </HStack>
                    </VStack>
                }
                renderItem={({ item: landmark }) => (
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => router.push({ pathname: '/(admin)/landmark/[id]', params: { id: landmark.id.toString() } })}
                        className="bg-background-50 rounded-3xl border border-outline-100 shadow-soft-1 overflow-hidden"
                    >
                        <HStack className="p-4 items-center gap-4">
                            <Box className="w-16 h-16 bg-background-200 rounded-2xl overflow-hidden">
                                <Image source={{ uri: landmark.image_url || "https://via.placeholder.com/150" }} className="w-full h-full" resizeMode="cover" />
                            </Box>
                            <VStack className='flex-1 gap-2'>
                                <View className=" flex-row flex-wrap gap-0.5">
                                    {
                                        landmark.categories.map(category => (
                                            <Badge
                                                key={`landmark-${landmark.id}-category-${category}`}
                                                action="info" variant="outline" className="self-start rounded-md border-primary-200">
                                                <BadgeText className="text-[10px] uppercase font-bold text-primary-600">{category || 'Uknown'}</BadgeText>
                                            </Badge>
                                        ))
                                    }
                                </View>
                                <Heading size="sm" className="text-typography-900 flex-shrink" numberOfLines={1}>{landmark.name}</Heading>
                                <Text size="xs" className="text-typography-500 flex-grow">ID: #{landmark.id}</Text>
                            </VStack>
                            <Icon as={ChevronRight} className="text-typography-300 mr-1" />
                        </HStack>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <VStack className="items-center justify-center py-20 gap-4">
                        <Icon as={Search} size="xl" className="text-typography-200" />
                        <Text className="text-typography-400">No matches found.</Text>
                        <Button variant="link" onPress={() => { setSearchString(''); setSelectedCategories([]); setSortKey('id'); setSortOrder('desc'); }}>
                            <ButtonText>Reset Filters</ButtonText>
                        </Button>
                    </VStack>
                }
            />

            {/* --- FILTER & SORT MODAL --- */}
            <Modal isOpen={showFilterModal} onClose={() => setShowFilterModal(false)}>
                <ModalBackdrop />
                <ModalContent className="rounded-[32px] p-2">
                    <ModalHeader className="p-4">
                        <Heading size="lg">Refine List</Heading>
                        <ModalCloseButton><Icon as={X} /></ModalCloseButton>
                    </ModalHeader>
                    <ModalBody >
                        <VStack
                            className="p-4 gap-6"
                        >
                            {/* Sort Section */}
                            <VStack className='gap-3'>
                                <Text size="xs" className="font-bold text-typography-500 uppercase tracking-widest">Sort By</Text>
                                <HStack className='gap-2'>
                                    <Button
                                        className={`flex-1 rounded-xl h-12 ${sortKey === 'id' ? 'bg-primary-600' : 'bg-background-100'}`}
                                        onPress={() => setSortKey('id')}
                                    >
                                        <ButtonIcon as={Clock} className="mr-2" color={sortKey === 'id' ? 'white' : '#6b7280'} />
                                        <ButtonText className={sortKey === 'id' ? 'text-white' : 'text-typography-600'}>Date</ButtonText>
                                    </Button>
                                    <Button
                                        className={`flex-1 rounded-xl h-12 ${sortKey === 'name' ? 'bg-primary-600' : 'bg-background-100'}`}
                                        onPress={() => setSortKey('name')}
                                    >
                                        <ButtonIcon as={SortAsc} className="mr-2" color={sortKey === 'name' ? 'white' : '#6b7280'} />
                                        <ButtonText className={sortKey === 'name' ? 'text-white' : 'text-typography-600'}>Name</ButtonText>
                                    </Button>
                                </HStack>

                                <HStack className='gap-2'>
                                    <Button
                                        variant="outline"
                                        className={`flex-1 rounded-xl h-12 border-2 ${sortOrder === 'asc' ? 'border-primary-500 bg-primary-50' : 'border-outline-100'}`}
                                        onPress={() => setSortOrder('asc')}
                                    >
                                        <ButtonIcon as={ArrowUp} className="mr-2 text-primary-600" />
                                        <ButtonText className="text-primary-700 font-bold">Ascending</ButtonText>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className={`flex-1 rounded-xl h-12 border-2 ${sortOrder === 'desc' ? 'border-primary-500 bg-primary-50' : 'border-outline-100'}`}
                                        onPress={() => setSortOrder('desc')}
                                    >
                                        <ButtonIcon as={ArrowDown} className="mr-2 text-primary-600" />
                                        <ButtonText className="text-primary-700 font-bold">Descending</ButtonText>
                                    </Button>
                                </HStack>
                            </VStack>

                            {/* Category Filter Section */}
                            <VStack className='gap-3'>
                                <Text size="xs" className="font-bold text-typography-500 uppercase tracking-widest">Filter Category</Text>
                                <View className="flex-row flex-wrap gap-2 ">
                                    {CATEGORIES.map(cat => (
                                        <TouchableOpacity
                                            key={cat}
                                            onPress={() => toggleCategory(cat)}
                                            className={`px-4 py-2.5 rounded-full border-2 ${selectedCategories.includes(cat) ? 'bg-primary-500 border-primary-500' : 'bg-background-50 border-outline-100'}`}
                                        >
                                            <HStack space="xs" className="items-center">
                                                {selectedCategories.includes(cat) && <Icon as={Check} size="xs" color="white" />}
                                                <Text size="sm" className={`font-bold ${selectedCategories.includes(cat) ? 'text-white' : 'text-typography-600'}`}>
                                                    {cat}
                                                </Text>
                                            </HStack>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </VStack>
                        </VStack>
                    </ModalBody>
                    <ModalFooter className="p-4">
                        <Button onPress={() => setShowFilterModal(false)} className="w-full rounded-2xl h-14 bg-primary-600">
                            <ButtonText className="font-bold">Show Results</ButtonText>
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <Fab size="lg" placement="bottom right" onPress={handleCreatePress} className="bg-primary-600 mb-4 mr-2 shadow-lg">
                <FabIcon as={Plus} />
                <FabLabel className="font-bold">Add New</FabLabel>
            </Fab>
        </Box>
    );
}