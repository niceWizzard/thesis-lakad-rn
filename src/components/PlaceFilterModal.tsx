
import {
    ArrowDown,
    ArrowUp,
    Check,
    Clock,
    Map as MapIcon,
    SortAsc,
    Star,
    X
} from 'lucide-react-native';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ScrollView, TouchableOpacity, View } from 'react-native';

import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
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
import { DISTRICT_TO_MUNICIPALITY_MAP } from '@/src/constants/jurisdictions';
import { LANDMARK_TYPES } from '@/src/constants/type';
import { PlaceDistrict } from '@/src/model/places.types';

export type SortKey = 'id' | 'name' | 'rating';
export type SortOrder = 'asc' | 'desc';

export type FilterFormData = {
    sortKey: SortKey;
    sortOrder: SortOrder;
    selectedTypes: string[];
    selectedDistrict: string | null;
    selectedMunicipality: string | null;
};

interface PlaceFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialFilters: FilterFormData;
    onApply: (filters: FilterFormData) => void;
}

export const PlaceFilterModal: React.FC<PlaceFilterModalProps> = ({
    isOpen,
    onClose,
    initialFilters,
    onApply
}) => {
    const { handleSubmit, setValue, watch, reset } = useForm<FilterFormData>({
        defaultValues: initialFilters
    });

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            reset(initialFilters);
        }
    }, [isOpen, initialFilters, reset]);

    const watchSortKey = watch('sortKey');
    const watchSortOrder = watch('sortOrder');
    const watchSelectedTypes = watch('selectedTypes');
    const watchSelectedDistrict = watch('selectedDistrict');
    const watchSelectedMunicipality = watch('selectedMunicipality');

    const handleClearFilters = () => {
        reset({
            sortKey: 'id',
            sortOrder: 'desc',
            selectedTypes: [],
            selectedDistrict: null,
            selectedMunicipality: null
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
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
                                <HStack className='gap-2 flex-wrap' >
                                    <Button
                                        className={`rounded-xl ${watchSortKey === 'id' ? 'bg-primary-600' : 'bg-background-100'}`}
                                        onPress={() => setValue('sortKey', 'id')}
                                    >
                                        <ButtonIcon as={Clock} color={watchSortKey === 'id' ? 'white' : '#6b7280'} />
                                        <ButtonText className={watchSortKey === 'id' ? 'text-white' : 'text-typography-600'}>Recent</ButtonText>
                                    </Button>
                                    <Button
                                        className={`rounded-xl ${watchSortKey === 'name' ? 'bg-primary-600' : 'bg-background-100'}`}
                                        onPress={() => setValue('sortKey', 'name')}
                                    >
                                        <ButtonIcon as={SortAsc} color={watchSortKey === 'name' ? 'white' : '#6b7280'} />
                                        <ButtonText className={watchSortKey === 'name' ? 'text-white' : 'text-typography-600'}>A-Z</ButtonText>
                                    </Button>

                                    {/* --- Rating Sort Button --- */}
                                    <Button
                                        className={`rounded-xl ${watchSortKey === 'rating' ? 'bg-primary-600' : 'bg-background-100'}`}
                                        onPress={() => setValue('sortKey', 'rating')}
                                    >
                                        <ButtonIcon as={Star} color={watchSortKey === 'rating' ? 'white' : '#6b7280'} />
                                        <ButtonText className={watchSortKey === 'rating' ? 'text-white' : 'text-typography-600'}>Rating</ButtonText>
                                    </Button>
                                </HStack>
                                <HStack className='gap-2'>
                                    <Button variant="outline" className={`rounded-xl ${watchSortOrder === 'asc' ? 'border-primary-600 bg-primary-50' : 'border-outline-100'}`} onPress={() => setValue('sortOrder', 'asc')}>
                                        <ButtonIcon as={ArrowUp} className="text-primary-600" /><ButtonText className="text-primary-700 font-bold">Asc</ButtonText>
                                    </Button>
                                    <Button variant="outline" className={`rounded-xl ${watchSortOrder === 'desc' ? 'border-primary-600 bg-primary-50' : 'border-outline-100'}`} onPress={() => setValue('sortOrder', 'desc')}>
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
                                            onPress={() => { setValue('selectedDistrict', null); setValue('selectedMunicipality', null); }}
                                            className={`px-4 py-2 rounded-xl border ${!watchSelectedDistrict ? 'bg-primary-600 border-primary-600' : 'bg-background-50 border-outline-200'}`}
                                        >
                                            <Text className={`text-xs font-bold ${!watchSelectedDistrict ? 'text-white' : 'text-typography-600'}`}>All</Text>
                                        </TouchableOpacity>
                                        {Object.keys(DISTRICT_TO_MUNICIPALITY_MAP).map(dist => (
                                            <TouchableOpacity
                                                key={dist}
                                                onPress={() => { setValue('selectedDistrict', dist); setValue('selectedMunicipality', null); }}
                                                className={`px-4 py-2 rounded-xl border mr-2 ${watchSelectedDistrict === dist ? 'bg-primary-600 border-primary-600' : 'bg-background-50 border-outline-200'}`}
                                            >
                                                <Text className={`text-xs font-bold ${watchSelectedDistrict === dist ? 'text-white' : 'text-typography-600'}`}>D-{dist}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </HStack>
                                </VStack>

                                {watchSelectedDistrict && (
                                    <VStack className="gap-2 mt-2">
                                        <Text size="xs" className="font-bold text-typography-400">MUNICIPALITY</Text>
                                        <View className="flex-row flex-wrap gap-2">
                                            {DISTRICT_TO_MUNICIPALITY_MAP[watchSelectedDistrict as PlaceDistrict].map(muni => (
                                                <TouchableOpacity
                                                    key={muni}
                                                    onPress={() => setValue('selectedMunicipality', watchSelectedMunicipality === muni ? null : muni)}
                                                    className={`px-3 py-1.5 rounded-lg border ${watchSelectedMunicipality === muni ? 'bg-secondary-500 border-secondary-500' : 'bg-background-50 border-outline-200'}`}
                                                >
                                                    <Text className={`text-[11px] font-bold ${watchSelectedMunicipality === muni ? 'text-white' : 'text-typography-600'}`}>
                                                        {muni.replace('_', ' ')}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </VStack>
                                )}
                            </VStack>

                            {/* 3. Category Filter Section */}
                            <VStack className='gap-3'>
                                <Text size="xs" className="font-bold text-typography-500 uppercase tracking-widest">Filter Category</Text>
                                <View className="flex-row flex-wrap gap-2 ">
                                    {LANDMARK_TYPES.map(cat => (
                                        <TouchableOpacity
                                            key={cat}
                                            onPress={() => setValue('selectedTypes', watchSelectedTypes.includes(cat) ? watchSelectedTypes.filter(c => c !== cat) : [...watchSelectedTypes, cat])}
                                            className={`px-4 py-2 rounded-full border ${watchSelectedTypes.includes(cat) ? 'bg-primary-600 border-primary-600' : 'bg-background-50 border-outline-200'}`}
                                        >
                                            <HStack space="xs" className="items-center">
                                                {watchSelectedTypes.includes(cat) && <Icon as={Check} size="xs" color="white" />}
                                                <Text size="xs" className={`font-bold ${watchSelectedTypes.includes(cat) ? 'text-white' : 'text-typography-600'}`}>{cat}</Text>
                                            </HStack>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </VStack>
                        </VStack>
                    </ScrollView>
                </ModalBody>
                <ModalFooter className="p-4 border-t border-outline-50">
                    <HStack space="md" className="w-full">
                        <Button variant="outline" action="secondary" className="rounded-2xl" onPress={handleClearFilters}>
                            <ButtonText>Clear All</ButtonText>
                        </Button>
                        <Button onPress={handleSubmit(onApply)} className="rounded-2xl bg-primary-600">
                            <ButtonText className="font-bold">Apply Filters</ButtonText>
                        </Button>
                    </HStack>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};
