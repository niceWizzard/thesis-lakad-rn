import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
    AlertCircle,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Layers,
    Map as MapIcon,
    Navigation2,
    Sparkles
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import * as z from 'zod';

// UI Components
import { Accordion, AccordionContent, AccordionHeader, AccordionItem, AccordionTitleText, AccordionTrigger } from '@/components/ui/accordion';
import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { FormControl, FormControlError, FormControlErrorIcon, FormControlErrorText, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Input, InputField } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

// Stores & Utils
import AlgorithmModule from '@/modules/algorithm-module/src/AlgorithmModule';
import LoadingModal from '@/src/components/LoadingModal';
import { DISTRICT_TO_MUNICIPALITY_MAP, MUNICIPALITIES } from '@/src/constants/jurisdictions';
import { LANDMARK_TYPES } from '@/src/constants/type';
import { useToastNotification } from '@/src/hooks/useToastNotification';
import { LandmarkDistrict, LandmarkMunicipality } from '@/src/model/landmark.types';
import { useLandmarkStore } from '@/src/stores/useLandmarkStore';
import { fetchFullDistanceMatrix } from '@/src/utils/fetchDistanceMatrix';
import { createItinerary } from '@/src/utils/fetchItineraries';
import { useTypePreferences } from '@/src/utils/preferencesManager';

const DISTRICTS: {
    id: LandmarkDistrict,
    label: string;
}[] = [
        { id: '1', label: 'District 1' },
        { id: '2', label: 'District 2' },
        { id: '3', label: 'District 3' },
        { id: '4', label: 'District 4' },
        { id: '5', label: 'District 5' },
        { id: '6', label: 'District 6' },
        { id: 'Lone', label: 'Lone District' },
    ];


const TYPES = LANDMARK_TYPES.map(v => ({
    id: v,
    label: v,
}))
const schema = z.object({
    maxDistance: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Enter valid KM"),
    maxPoi: z.string().refine((val) => {
        const n = Number(val);
        return !isNaN(n) && Number.isInteger(n) && n > 0;
    }, "Enter a positive whole number").refine(v => {
        const n = Number(v);
        return n <= 50;
    }, "AGAM only supports up to 50 stopovers"),
    districts: z.array(z.string()).min(1, "Select at least one district"),
    types: z.array(z.string()).min(1, "Select at least one category"),
    municipalities: z.array(z.string()).min(1, "Select at least one municipality"),
});

type FormData = z.infer<typeof schema>;


enum GeneratingState {
    Idle,
    Fetching,
    Generating,
    Saving,
}

const CreateWithAgamScreen = () => {
    const router = useRouter();
    const landmarks = useLandmarkStore(v => v.landmarks);
    const queryClient = useQueryClient();
    const preferredTypes = useTypePreferences();
    const [state, setState] = useState(GeneratingState.Idle)

    const { showToast } = useToastNotification()

    const isGenerating = state !== GeneratingState.Idle;


    const { control, handleSubmit, watch, setValue, formState: { errors, isValid } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            maxDistance: '100',
            maxPoi: '10',
            districts: DISTRICTS.map(d => d.id),
            types: TYPES.map(c => c.id),
            municipalities: MUNICIPALITIES,
        },
        mode: 'onChange',
    });

    const selectedDistricts = watch('districts');
    const selectedTypes = watch('types');
    const selectedMunicipalities = watch('municipalities');

    const validMunicipalities = useMemo(() => {
        return selectedDistricts.flatMap(v => DISTRICT_TO_MUNICIPALITY_MAP[v as LandmarkDistrict] || []).sort((a, b) => a.localeCompare(b));
    }, [selectedDistricts]);

    useEffect(() => {
        const nextMunicipalities = selectedMunicipalities.filter(v =>
            validMunicipalities.includes(v as LandmarkMunicipality)
        );

        if (JSON.stringify(nextMunicipalities) !== JSON.stringify(selectedMunicipalities)) {
            setValue('municipalities', nextMunicipalities, { shouldValidate: true });
        }
    }, [validMunicipalities, selectedMunicipalities, setValue]);


    // Dynamic counter logic
    const availableCount = useMemo(() => {
        return landmarks.filter(l =>
            selectedDistricts.includes(l.district) &&
            selectedMunicipalities.includes(l.municipality) &&
            selectedTypes.includes(l.type)
        ).length;
    }, [landmarks, selectedDistricts, selectedTypes, selectedMunicipalities]);



    const toggleItem = (current: string[], id: string, field: 'districts' | 'types' | 'municipalities') => {
        const next = current.includes(id) ? current.filter(i => i !== id) : [...current, id];
        setValue(field, next, { shouldValidate: true });
    };

    const onGenerate = async (formData: FormData) => {
        setState(GeneratingState.Fetching);
        try {
            const filteredLandmarks = landmarks.filter(l =>
                formData.districts.includes(l.district) &&
                selectedMunicipalities.includes(l.municipality) &&
                formData.types.includes(l.type)
            );

            if (filteredLandmarks.length < 2) throw new Error("Not enough landmarks found.");

            const pois = filteredLandmarks.reduce((obj, cur) => {
                const interest = preferredTypes.includes(cur.type) ? 1 : 0;
                obj[cur.id] = { interest: interest, rating: cur.gmaps_rating / 5.0 };
                return obj;
            }, {} as any);

            const landmarkDistanceMap = await fetchFullDistanceMatrix(
                filteredLandmarks.map(v => ({
                    id: v.id.toString(),
                    coords: [v.longitude, v.latitude],
                }))
            );

            setState(GeneratingState.Generating);

            const {
                itinerary: result,
                distance,
            } = await AlgorithmModule.generateItinerary(
                Number.parseFloat(formData.maxDistance) * 1000,
                Number.parseInt(formData.maxPoi),
                [1, 1, 1, 1],
                pois,
                landmarkDistanceMap,
            );

            if (!result || result.length === 0) throw new Error("No valid route found.");


            setState(GeneratingState.Saving)

            const newId = await createItinerary({
                poiIds: result.map((v: string) => Number.parseInt(v)),
                distance
            });

            queryClient.invalidateQueries({ queryKey: ['itineraries'] });
            router.replace({ pathname: '/itinerary/[id]', params: { id: newId } });
        } catch (err: any) {
            console.log(err)
            showToast({
                title: "Generation Error",
                description: err.message ?? "Something went wrong.",
                action: "error",
            })
        } finally {
            setState(GeneratingState.Idle)
        }
    };


    function getLoadingText() {
        switch (state) {
            case GeneratingState.Fetching:
                return "Querying information..."
            case GeneratingState.Generating:
                return "Generating itinerary..."
            case GeneratingState.Saving:
                return "Saving itinerary..."
            default:
                return "Generating..."
        }
    }


    return (
        <>
            <LoadingModal
                isShown={isGenerating}
                loadingText={getLoadingText()}
            />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1 bg-background-0"
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View className="flex-1">
                        <ScrollView contentContainerClassName="p-6 pb-32">
                            {/* Header & Pool Counter */}
                            <VStack className="mb-6 gap-2">
                                <HStack className="items-center justify-between">
                                    <VStack className="gap-1">
                                        <HStack className="items-center gap-2">
                                            <Icon as={Sparkles} />
                                            <Heading size="lg">Agam Planner</Heading>
                                        </HStack>
                                        <Text size="sm" className="text-typography-500">Smart-Generated Itineraries</Text>
                                    </VStack>

                                    <Box className="bg-primary-50 px-4 py-2 rounded-lg border border-primary-100 items-center">
                                        <Text size="xs" className="font-bold text-primary-700 uppercase tracking-tighter">Pool Size</Text>
                                        <Heading size="md" className="text-primary-800">{availableCount}</Heading>
                                    </Box>
                                </HStack>
                            </VStack>

                            {/* Constraints Accordion */}
                            <Accordion variant='unfilled' className="gap-3 mb-6">
                                <AccordionItem value="districts" className="border border-outline-100 rounded-lg bg-background-50 overflow-hidden">
                                    <AccordionHeader>
                                        <AccordionTrigger>
                                            {({ isExpanded }: any) => (
                                                <HStack className="it`ems-center justify-between w-full pr-4">
                                                    <HStack className="items-center gap-3">
                                                        <Icon as={MapIcon} className="text-primary-600" />
                                                        <AccordionTitleText className="font-bold">Districts</AccordionTitleText>
                                                    </HStack>
                                                    <Icon as={isExpanded ? ChevronUp : ChevronDown} size="sm" />
                                                </HStack>
                                            )}
                                        </AccordionTrigger>
                                    </AccordionHeader>
                                    <AccordionContent>
                                        <View className="flex-row flex-wrap gap-2 p-2">
                                            {DISTRICTS.map(d => {
                                                const active = selectedDistricts.includes(d.id);
                                                return (
                                                    <TouchableOpacity
                                                        key={d.id}
                                                        onPress={() => {
                                                            const isActivating = !selectedDistricts.includes(d.id);
                                                            toggleItem(selectedDistricts, d.id, 'districts');

                                                            if (isActivating) {
                                                                // Get all municipalities for this specific district
                                                                const newMunis = DISTRICT_TO_MUNICIPALITY_MAP[d.id] || [];
                                                                // Merge with existing, avoiding duplicates
                                                                const merged = Array.from(new Set([...selectedMunicipalities, ...newMunis]));
                                                                setValue('municipalities', merged, { shouldValidate: true });
                                                            }
                                                        }}
                                                        className={`px-3 py-1.5 rounded-md border ${active ? 'bg-primary-600 border-primary-600' : 'bg-background-0 border-outline-200'}`}
                                                    >
                                                        <Text size="xs" className={active ? 'text-white font-bold' : 'text-typography-600'}>{d.label}</Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    </AccordionContent>
                                </AccordionItem>



                                <AccordionItem value="municipalities" className="border border-outline-100 rounded-lg bg-background-50 overflow-hidden">
                                    <AccordionHeader>
                                        <AccordionTrigger>
                                            {({ isExpanded }: any) => (
                                                <HStack className="items-center justify-between w-full pr-4">
                                                    <HStack className="items-center gap-3">
                                                        <Icon as={Layers} className="text-primary-600" />
                                                        <AccordionTitleText className="font-bold">Municipalities</AccordionTitleText>
                                                    </HStack>
                                                    <Icon as={isExpanded ? ChevronUp : ChevronDown} size="sm" />
                                                </HStack>
                                            )}
                                        </AccordionTrigger>
                                    </AccordionHeader>
                                    <AccordionContent>
                                        <View className="flex-row flex-wrap gap-2 p-2">
                                            {MUNICIPALITIES.map(c => {
                                                const active = selectedMunicipalities.includes(c);
                                                const isValid = validMunicipalities.includes(c)
                                                let extraDesign = 'bg-background-0 border-outline-200';
                                                if (!isValid) {
                                                    extraDesign = 'bg-background-400 border-outline-100'
                                                }
                                                else if (active) {
                                                    extraDesign = 'bg-primary-600 border-primary-600'
                                                }
                                                return (
                                                    <TouchableOpacity
                                                        key={c}
                                                        onPress={() => toggleItem(selectedMunicipalities, c, 'municipalities')}
                                                        disabled={!isValid}
                                                        className={`px-3 py-1.5 rounded-md border ${extraDesign}`}
                                                    >
                                                        <Text size="xs" className={active ? 'text-white font-bold' : 'text-typography-600'}>{c}</Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                            {
                                                validMunicipalities.length === 0 && (
                                                    <Text>No valid municipalities found</Text>
                                                )
                                            }
                                        </View>
                                    </AccordionContent>
                                </AccordionItem>


                                <AccordionItem value="categories" className="border border-outline-100 rounded-lg bg-background-50 overflow-hidden">
                                    <AccordionHeader>
                                        <AccordionTrigger>
                                            {({ isExpanded }: any) => (
                                                <HStack className="items-center justify-between w-full pr-4">
                                                    <HStack className="items-center gap-3">
                                                        <Icon as={Layers} className="text-primary-600" />
                                                        <AccordionTitleText className="font-bold">Categories</AccordionTitleText>
                                                    </HStack>
                                                    <Icon as={isExpanded ? ChevronUp : ChevronDown} size="sm" />
                                                </HStack>
                                            )}
                                        </AccordionTrigger>
                                    </AccordionHeader>
                                    <AccordionContent>
                                        <View className="flex-row flex-wrap gap-2 p-2">
                                            {TYPES.map(c => {
                                                const active = selectedTypes.includes(c.id);
                                                return (
                                                    <TouchableOpacity
                                                        key={c.id}
                                                        onPress={() => toggleItem(selectedTypes, c.id, 'types')}
                                                        className={`px-3 py-1.5 rounded-md border ${active ? 'bg-primary-600 border-primary-600' : 'bg-background-0 border-outline-200'}`}
                                                    >
                                                        <Text size="xs" className={active ? 'text-white font-bold' : 'text-typography-600'}>{c.label}</Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>

                            {/* Configuration Inputs */}
                            <VStack className="gap-4">
                                <Box className="bg-background-50 p-4 rounded-xl border border-outline-100">
                                    <FormControl isInvalid={!!errors.maxDistance}>
                                        <FormControlLabel className="mb-2">
                                            <HStack className="items-center gap-2">
                                                <Icon as={Navigation2} size="xs" className="text-primary-600" />
                                                <FormControlLabelText size="sm" className="font-bold">Max Distance (KM)</FormControlLabelText>
                                            </HStack>
                                        </FormControlLabel>
                                        <Controller
                                            control={control}
                                            name="maxDistance"
                                            render={({ field: { onChange, value } }) => (
                                                <Input variant="outline" size="md" className="h-12 bg-background-0 rounded-lg">
                                                    <InputField
                                                        value={value}
                                                        onChangeText={onChange}
                                                        keyboardType="numeric"
                                                        placeholder="e.g. 5"
                                                    />
                                                </Input>
                                            )}
                                        />
                                        <FormControlError className="mt-1">
                                            <FormControlErrorIcon as={AlertCircle} size="xs" />
                                            <FormControlErrorText size="xs">{errors.maxDistance?.message}</FormControlErrorText>
                                        </FormControlError>
                                    </FormControl>
                                </Box>

                                <Box className="bg-background-50 p-4 rounded-xl border border-outline-100">
                                    <FormControl isInvalid={!!errors.maxPoi}>
                                        <FormControlLabel className="mb-2">
                                            <HStack className="items-center gap-2">
                                                <Icon as={CheckCircle2} size="xs" className="text-primary-600" />
                                                <FormControlLabelText size="sm" className="font-bold">Max Stopovers</FormControlLabelText>
                                            </HStack>
                                        </FormControlLabel>
                                        <Controller
                                            control={control}
                                            name="maxPoi"
                                            render={({ field: { onChange, value } }) => (
                                                <Input variant="outline" size="md" className="h-12 bg-background-0 rounded-lg">
                                                    <InputField
                                                        value={value}
                                                        onChangeText={onChange}
                                                        keyboardType="number-pad"
                                                        placeholder="e.g. 8"
                                                    />
                                                </Input>
                                            )}
                                        />
                                        <FormControlError className="mt-1">
                                            <FormControlErrorIcon as={AlertCircle} size="xs" />
                                            <FormControlErrorText size="xs">{errors.maxPoi?.message}</FormControlErrorText>
                                        </FormControlError>
                                    </FormControl>
                                </Box>
                            </VStack>

                            {/* Warning Hint */}
                            {availableCount < 2 && (
                                <HStack className="mt-4 p-3 bg-warning-50 rounded-lg border border-warning-100 gap-2 items-center">
                                    <Icon as={AlertCircle} size="xs" className="text-warning-600" />
                                    <Text size="xs" className="text-warning-700">Select more filters to generate a valid route.</Text>
                                </HStack>
                            )}
                        </ScrollView>

                        {/* Bottom Action */}
                        <Box className="p-6 bg-background-0 border-t border-outline-50 pb-8">
                            <Button
                                onPress={handleSubmit(onGenerate)}
                                isDisabled={isGenerating || !isValid || availableCount < 2}
                                className="rounded-xl h-14 bg-primary-600 shadow-none"
                            >
                                {isGenerating ? <ButtonSpinner color="white" /> : (
                                    <HStack className="items-center gap-2">
                                        <ButtonText className="font-bold">Generate Itinerary</ButtonText>
                                        <ButtonIcon as={Sparkles} />
                                    </HStack>
                                )}
                            </Button>
                        </Box>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </>
    );
};

export default CreateWithAgamScreen;