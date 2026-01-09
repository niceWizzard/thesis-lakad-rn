import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import {
    ChevronDown,
    ChevronUp,
    Layers,
    Map as MapIcon,
    Navigation2,
    Sparkles
} from 'lucide-react-native';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import * as z from 'zod';

import {
    Accordion,
    AccordionContent,
    AccordionHeader,
    AccordionIcon,
    AccordionItem,
    AccordionTitleText,
    AccordionTrigger
} from '@/components/ui/accordion';
import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Input, InputField, InputSlot } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

import { Icon } from '@/components/ui/icon';
import { useLandmarkStore } from '@/src/stores/useLandmarkStore';
import { createItinerary } from '@/src/utils/fetchItineraries';

// --- Types & Data ---
const DISTRICTS = [
    { id: 'district1', label: 'District 1' },
    { id: 'district2', label: 'District 2' },
    { id: 'district3', label: 'District 3' },
    { id: 'district4', label: 'District 4' },
    { id: 'district5', label: 'District 5' },
    { id: 'district6', label: 'District 6' },
    { id: 'lone', label: 'Lone District' },
];

const CATEGORIES = [
    { id: 'museum', label: 'Museum' },
    { id: 'nature', label: 'Nature & Parks' },
    { id: 'culture', label: 'Cultural Sites' },
];

const schema = z.object({
    maxDistance: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "Please enter a valid distance",
    }),
    districts: z.array(z.string()).min(1, "Select at least one district"),
    categories: z.array(z.string()).min(1, "Select at least one category"),
});

type FormData = z.infer<typeof schema>;

const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

const CreateWithAgamScreen = () => {
    const router = useRouter();
    const landmarks = useLandmarkStore(v => v.landmarks);

    const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            maxDistance: '10',
            districts: DISTRICTS.map(d => d.id),
            categories: CATEGORIES.map(c => c.id),
        }
    });

    const selectedDistricts = watch('districts');
    const selectedCategories = watch('categories');

    const toggleItem = (current: string[], id: string, field: 'districts' | 'categories') => {
        const next = current.includes(id)
            ? current.filter(i => i !== id)
            : [...current, id];
        setValue(field, next, { shouldValidate: true });
    };

    const onGenerate = async (data: FormData) => {
        try {
            const newId = await createItinerary({
                poiIds: shuffle(landmarks.map(v => v.id)),
            })

            router.replace({ pathname: '/itinerary/[id]', params: { id: newId } });
        } catch (err) {
            const error = err as Error
            Alert.alert(error.message)
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="bg-background-0"
            style={{ flex: 1 }}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View className="flex-1">
                    <ScrollView
                        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Header Intro */}
                        <VStack className="mb-8 gap-2">
                            <HStack className="items-center gap-2">
                                <View className="bg-primary-100 p-2 rounded-lg">
                                    <Sparkles size={20} className="text-primary-600" />
                                </View>
                                <Heading size="xl">Agam Planner</Heading>
                            </HStack>
                            <Text className="text-typography-500">
                                Set your constraints and let our algorithm curate the perfect walk for you.
                            </Text>
                        </VStack>

                        <Accordion variant="filled" className="bg-transparent gap-4 mb-8">
                            {/* Districts Accordion */}
                            <AccordionItem value="districts" className="border border-outline-100 rounded-2xl bg-background-50 overflow-hidden">
                                <AccordionHeader>
                                    {/* 1. Ensure the Trigger allows full-width content */}
                                    <AccordionTrigger className="flex-row w-full">
                                        {({ isExpanded }: { isExpanded: boolean }) => (
                                            <View className="flex-row items-center justify-between w-full">
                                                {/* Left Side: Icon and Title */}
                                                <Icon as={MapIcon} className='mr-4' />
                                                <AccordionTitleText size="md" className="font-bold">
                                                    Districts
                                                </AccordionTitleText>
                                                <Text size="xs" className="text-primary-200 font-bold">
                                                    {selectedDistricts.length} Selected
                                                </Text>
                                                <AccordionIcon
                                                    as={isExpanded ? ChevronUp : ChevronDown}
                                                    className="text-typography-500"
                                                />
                                            </View>
                                        )}
                                    </AccordionTrigger>
                                </AccordionHeader>
                                <AccordionContent className="p-4">
                                    <View className="flex-row flex-wrap gap-2">
                                        {DISTRICTS.map(d => (
                                            <TouchableOpacity
                                                key={d.id}
                                                onPress={() => toggleItem(selectedDistricts, d.id, 'districts')}
                                                className={`px-4 py-2 rounded-full border ${selectedDistricts.includes(d.id) ? 'bg-primary-600 border-primary-600' : 'bg-background-0 border-outline-200'}`}
                                            >
                                                <Text size="xs" className={selectedDistricts.includes(d.id) ? 'text-white font-bold' : 'text-typography-600'}>
                                                    {d.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Categories Accordion (Repeat same structure) */}
                            <AccordionItem value="categories" className="border border-outline-100 rounded-2xl bg-background-50 overflow-hidden">
                                <AccordionHeader>
                                    <AccordionTrigger className="flex-row w-full justify-between">
                                        {({ isExpanded }: { isExpanded: boolean }) => (
                                            <View className="flex-row items-center justify-between w-full">
                                                {/* Left Side: Icon and Title */}
                                                <Icon as={Layers} className='mr-4' />
                                                <AccordionTitleText size="md" className="font-bold">
                                                    Categories
                                                </AccordionTitleText>
                                                <Text size="xs" className="text-primary-200 font-bold">
                                                    {selectedCategories.length} Selected
                                                </Text>
                                                <AccordionIcon
                                                    as={isExpanded ? ChevronUp : ChevronDown}
                                                    className="text-typography-500"
                                                />
                                            </View>
                                        )}
                                    </AccordionTrigger>
                                </AccordionHeader>
                                <AccordionContent className="p-4">
                                    <View className="flex-row flex-wrap gap-2">
                                        {CATEGORIES.map(c => (
                                            <TouchableOpacity
                                                key={c.id}
                                                onPress={() => toggleItem(selectedCategories, c.id, 'categories')}
                                                className={`px-4 py-2 rounded-full border ${selectedCategories.includes(c.id) ? 'bg-secondary-600 border-secondary-600' : 'bg-background-0 border-outline-200'}`}
                                            >
                                                <Text size="xs" className={selectedCategories.includes(c.id) ? 'text-white font-bold' : 'text-typography-600'}>
                                                    {c.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>

                        {/* Distance Input */}
                        <VStack className="gap-3 bg-background-50 p-6 rounded-3xl border border-outline-100 shadow-soft-1">
                            <HStack className="items-center gap-2">
                                <Navigation2 size={18} className="text-primary-600" />
                                <Text size="sm" className="font-bold text-typography-900">Maximum Distance</Text>
                            </HStack>
                            <Controller
                                control={control}
                                name="maxDistance"
                                render={({ field: { onChange, value, onBlur } }) => (
                                    <Input variant="outline" size="lg" className="rounded-xl" isInvalid={!!errors.maxDistance}>
                                        <InputField
                                            placeholder="e.g. 5"
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                            keyboardType="numeric"
                                        />
                                        <InputSlot className="pr-4">
                                            <Text size="sm" className="font-bold text-typography-400">KM</Text>
                                        </InputSlot>
                                    </Input>
                                )}
                            />
                            <Text size="xs" className="text-typography-500 italic">
                                We will optimize the itinerary to stay under this limit.
                            </Text>
                        </VStack>
                    </ScrollView>

                    {/* Sticky Footer Action */}
                    <Box className="absolute bottom-0 left-0 right-0 p-6 bg-background-0 border-t border-outline-50">
                        <Button
                            onPress={handleSubmit(onGenerate)}
                            size="lg"
                            className="rounded-2xl h-14 bg-primary-600 shadow-soft-2"
                        >
                            <ButtonText className="font-bold">Generate Itinerary</ButtonText>
                            <ButtonIcon as={Sparkles} className="ml-2" />
                        </Button>
                    </Box>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};

export default CreateWithAgamScreen;