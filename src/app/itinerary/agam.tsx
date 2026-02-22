import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
    AlertCircle,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Layers,
    ListCheck,
    Map as MapIcon,
    Navigation2,
    Sparkles
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    TouchableOpacity,
    View
} from 'react-native';
import * as z from 'zod';

// UI Components
import { Accordion, AccordionContent, AccordionHeader, AccordionItem, AccordionTitleText, AccordionTrigger } from '@/components/ui/accordion';
import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { FormControl, FormControlError, FormControlErrorIcon, FormControlErrorText, FormControlHelper, FormControlHelperText, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';
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
import { StorageKey } from '@/src/constants/Key';
import { LANDMARK_TYPES } from '@/src/constants/type';
import { useToastNotification } from '@/src/hooks/useToastNotification';
import { PlaceDistrict, PlaceMunicipality } from '@/src/model/places.types';
import { fetchDistanceMatrix } from '@/src/utils/distance/fetchDistanceMatrix';
import { createItinerary } from '@/src/utils/fetchItineraries';
import { fetchVerifiedPlaces } from '@/src/utils/landmark/fetchLandmarks';
import { mmkvStorage } from '@/src/utils/mmkv';
import { useTypePreferences } from '@/src/utils/preferencesManager';
import { useIsFocused } from '@react-navigation/native';
import { CopilotProvider, CopilotStep, useCopilot, walkthroughable } from 'react-native-copilot';


const CopilotBox = walkthroughable(Box);
const CopilotAccordionItem = walkthroughable(AccordionItem);

const DISTRICTS: {
    id: PlaceDistrict,
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
    }, "Enter a positive whole number").refine(v => Number(v) <= 50, "AGAM only supports up to 50 stopovers"),
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

const CreateWithAgamScreenContent = () => {
    const router = useRouter();
    const { data: landmarks } = useQuery({
        queryKey: ['landmarks'],
        queryFn: fetchVerifiedPlaces,
        initialData: [],
    })
    const queryClient = useQueryClient();
    const preferredTypes = useTypePreferences();
    const [state, setState] = useState(GeneratingState.Idle)
    const scrollViewRef = useRef<ScrollView>(null);
    const { start } = useCopilot();

    const { showToast } = useToastNotification()

    const isGenerating = state !== GeneratingState.Idle;
    const isFocused = useIsFocused();

    const [queryProgress, setQueryProgress] = useState(0)
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;

        if (isFocused) {
            const hasShown = mmkvStorage.getBoolean(StorageKey.AgamTutorialShown);
            if (!hasShown) {
                setExpandedItems([]);
                timeout = setTimeout(() => {
                    start();
                    mmkvStorage.set(StorageKey.AgamTutorialShown, true);
                }, 100);
            }
        }

        return () => {
            if (timeout) clearTimeout(timeout);
        };
    }, [isFocused, start]);


    const { control, handleSubmit, watch, setValue, formState: { errors, isValid } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            maxDistance: '100',
            maxPoi: '10',
            types: [],
            municipalities: [],
        },
        mode: 'onChange',
    });

    const selectedTypes = watch('types');
    const selectedMunicipalities = watch('municipalities');

    const availableCount = useMemo(() => {
        return landmarks.filter(l =>
            selectedMunicipalities.includes(l.municipality) &&
            l.type &&
            selectedTypes.includes(l.type)
        ).length;
    }, [landmarks, selectedMunicipalities, selectedTypes]);


    const toggleItem = (current: string[], id: string, field: 'types' | 'municipalities') => {
        const next = current.includes(id) ? current.filter(i => i !== id) : [...current, id];
        setValue(field, next, { shouldValidate: true });
    };

    const toggleAll = (field: 'types' | 'municipalities', action: 'select' | 'deselect') => {
        if (action === 'deselect') {
            setValue(field, [], { shouldValidate: true });
            return;
        }

        let itemsToSelect: string[] = [];
        if (field === 'types') {
            itemsToSelect = LANDMARK_TYPES;
        } else if (field === 'municipalities') {
            itemsToSelect = MUNICIPALITIES;
        }
        setValue(field, itemsToSelect, { shouldValidate: true });
    };

    const toggleAllInDistrict = (districtId: PlaceDistrict) => {
        const districtMunis = [...(DISTRICT_TO_MUNICIPALITY_MAP[districtId] || [])];
        // Cast to PlaceMunicipality[] to ensure compatibility
        const allSelected = districtMunis.every(m =>
            (selectedMunicipalities as PlaceMunicipality[]).includes(m)
        );

        if (allSelected) {
            // Remove only the munis in this district
            const next = (selectedMunicipalities as PlaceMunicipality[]).filter(
                m => !districtMunis.includes(m)
            );
            setValue('municipalities', next, { shouldValidate: true });
        } else {
            // Add all munis in this district, ensuring no duplicates
            const next = Array.from(new Set([...selectedMunicipalities, ...districtMunis]));
            setValue('municipalities', next as PlaceMunicipality[], { shouldValidate: true });
        }
    };

    const onGenerate = async (formData: FormData) => {
        setState(GeneratingState.Fetching);
        try {
            const filteredLandmarks = landmarks.filter(l =>
                selectedMunicipalities.includes(l.municipality) &&
                l.type &&
                formData.types.includes(l.type)
            );

            if (filteredLandmarks.length < 2) throw new Error("Not enough landmarks found.");

            const pois = filteredLandmarks.reduce((obj, cur) => {
                const interest = cur.type && preferredTypes.includes(cur.type) ? 1 : 0;
                obj[cur.id] = { interest: interest, rating: cur.gmaps_rating / 5.0 };
                return obj;
            }, {} as any);

            const landmarkDistanceMap = await Promise.race([
                fetchDistanceMatrix(
                    filteredLandmarks.map(v => v.id),
                    (progress) => {
                        setQueryProgress(progress);
                    }
                ),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error("Query timed out.")), 15000)
                )
            ]);


            setState(GeneratingState.Generating);

            const {
                itinerary: result,
                distance,
            } = await Promise.race([
                AlgorithmModule.generateItinerary(
                    Number.parseFloat(formData.maxDistance) * 1000,
                    Number.parseInt(formData.maxPoi),
                    [1, 1, 1, 1],
                    pois,
                    landmarkDistanceMap,
                ),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error("Generation timed out.")), 20000)
                )
            ]);

            if (!result || result.length === 0) throw new Error("No valid route found.");


            setState(GeneratingState.Saving)

            const newId = await createItinerary({
                poiIds: result.map((v: string) => Number.parseInt(v)),
                distance
            });

            queryClient.invalidateQueries({ queryKey: ['itineraries'] });
            router.replace({ pathname: '/itinerary/[id]', params: { id: newId, autoOpenCardView: 'true', } });
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
                return `Querying information (${Math.round(queryProgress)}%)`
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
                className="bg-background-0"
                style={{ flex: 1 }}
            >
                <ScrollView
                    ref={scrollViewRef}
                    keyboardShouldPersistTaps="handled"
                    contentContainerClassName='p-6 gap-4'
                    stickyHeaderIndices={[0]}
                >
                    {/* Header & Pool Counter */}
                    <VStack className="bg-background-0 py-6 gap-2">
                        <HStack className="items-center justify-between">
                            <VStack className="gap-1">
                                <HStack className="items-center gap-2">
                                    <Icon as={Sparkles} />
                                    <Heading size="lg">Agam Planner</Heading>
                                </HStack>
                                <Text size="sm" className="text-typography-500">Smart-Generated Itineraries</Text>
                                <TouchableOpacity onPress={() => {
                                    setExpandedItems([]);
                                    setTimeout(start, 100)
                                }}>
                                    <Text size="sm" className="text-primary-600 font-bold">How to use Agam?</Text>
                                </TouchableOpacity>
                            </VStack>

                            <CopilotStep
                                text="The Pool Size gauge shows how many potential landmarks match your current criteria. A larger pool gives the algorithm more options."
                                order={1}
                                name="poolCounter"
                            >
                                <CopilotBox className="bg-primary-50 px-4 py-2 rounded-lg border border-primary-100 items-center">
                                    <Text size="xs" className="font-bold text-primary-700 uppercase tracking-tighter">Pool Size</Text>
                                    <Heading size="md" className="text-primary-800">{availableCount} / {landmarks.length}</Heading>
                                </CopilotBox>
                            </CopilotStep>
                        </HStack>
                    </VStack>
                    {/* Constraints Accordion */}
                    <Accordion
                        variant='unfilled'
                        className="gap-3"
                        value={expandedItems}
                        onValueChange={(item) => setExpandedItems(item)}
                    >
                        <CopilotStep
                            text="Tap here to filter landmarks by specific Districts or Municipalities."
                            order={2}
                            name="locationFilter"
                        >
                            <CopilotAccordionItem value="location" className="border border-outline-100 rounded-lg bg-background-50 overflow-hidden">
                                <AccordionHeader>
                                    <AccordionTrigger>
                                        {({ isExpanded }: any) => (
                                            <HStack className="items-center justify-between w-full pr-4">
                                                <HStack className="items-center gap-3">
                                                    <Icon as={MapIcon} className="text-primary-600" />
                                                    <AccordionTitleText className="font-bold">Location (Districts & Municipalities)</AccordionTitleText>
                                                </HStack>
                                                <Icon as={isExpanded ? ChevronUp : ChevronDown} size="sm" />
                                            </HStack>
                                        )}
                                    </AccordionTrigger>
                                </AccordionHeader>
                                <AccordionContent>
                                    <HStack className="justify-end my-2">
                                        <TouchableOpacity
                                            onPress={() => toggleAll('municipalities', selectedMunicipalities.length === MUNICIPALITIES.length ? 'deselect' : 'select')}
                                            className="flex-row items-center gap-2 border border-primary-200 rounded-lg px-2 py-1"
                                        >
                                            <Icon as={ListCheck} className="text-primary-600" />
                                            <Text size="sm" className="text-primary-600 font-bold uppercase tracking-wider">
                                                {selectedMunicipalities.length === MUNICIPALITIES.length ? "Deselect All Districts" : "Select All Districts"}
                                            </Text>
                                        </TouchableOpacity>
                                    </HStack>
                                    <VStack className="p-2 gap-4">
                                        {DISTRICTS.map((district) => {
                                            const children = DISTRICT_TO_MUNICIPALITY_MAP[district.id] || [];
                                            const areAllSelected = children.every(m => selectedMunicipalities.includes(m));

                                            return (
                                                <VStack key={district.id} className="gap-2 pb-2 border-b border-outline-50">
                                                    <HStack className="justify-between items-center bg-background-100 p-2 rounded-lg">
                                                        <Text size="md" className="font-bold text-typography-900">{district.label}</Text>
                                                        <TouchableOpacity onPress={() => toggleAllInDistrict(district.id)}>
                                                            <Text size="sm" className="text-primary-600 font-bold">
                                                                {areAllSelected ? "Deselect All" : "Select All"}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    </HStack>

                                                    <View className="flex-row flex-wrap gap-2 px-1">
                                                        {children.map((muni) => {
                                                            const isMuniActive = selectedMunicipalities.includes(muni);
                                                            return (
                                                                <TouchableOpacity
                                                                    key={muni}
                                                                    onPress={() => toggleItem(selectedMunicipalities, muni, 'municipalities')}
                                                                    className={`px-3 py-1.5 rounded-md border ${isMuniActive ? 'bg-primary-100 border-primary-600' : 'bg-background-0 border-outline-200'
                                                                        }`}
                                                                >
                                                                    <Text size="sm" className={isMuniActive ? 'text-typography-900 font-bold' : 'text-typography-500'}>
                                                                        {muni}
                                                                    </Text>
                                                                </TouchableOpacity>
                                                            );
                                                        })}
                                                    </View>
                                                </VStack>
                                            );
                                        })}
                                    </VStack>
                                </AccordionContent>
                            </CopilotAccordionItem>
                        </CopilotStep>
                        <CopilotStep
                            text="Select specific categories of landmarks you want to include in your trip."
                            order={3}
                            name="typeFilter"
                        >
                            <CopilotAccordionItem value="types" className="border border-outline-100 rounded-lg bg-background-50 overflow-hidden">
                                <AccordionHeader>
                                    <AccordionTrigger>
                                        {({ isExpanded }: any) => (
                                            <HStack className="items-center justify-between w-full pr-4">
                                                <HStack className="items-center gap-3">
                                                    <Icon as={Layers} className="text-primary-600" />
                                                    <AccordionTitleText className="font-bold">Types</AccordionTitleText>
                                                </HStack>
                                                <Icon as={isExpanded ? ChevronUp : ChevronDown} size="sm" />
                                            </HStack>
                                        )}
                                    </AccordionTrigger>
                                </AccordionHeader>
                                <AccordionContent>
                                    <HStack className="justify-end gap-4 px-2 mb-2">
                                        <TouchableOpacity onPress={() => toggleAll('types', selectedTypes.length === LANDMARK_TYPES.length ? 'deselect' : 'select')}>
                                            <Text size="sm" className="text-primary-600 font-bold">
                                                {selectedTypes.length === LANDMARK_TYPES.length ? "Deselect All" : "Select All"}
                                            </Text>
                                        </TouchableOpacity>
                                    </HStack>
                                    <View className="flex-row flex-wrap gap-2 p-2">
                                        {TYPES.map(c => {
                                            const active = selectedTypes.includes(c.id);
                                            return (
                                                <TouchableOpacity
                                                    key={c.id}
                                                    onPress={() => toggleItem(selectedTypes, c.id, 'types')}
                                                    className={`px-3 py-1.5 rounded-md border ${active ? 'bg-primary-100 border-primary-600' : 'bg-background-0 border-outline-200'}`}
                                                >
                                                    <Text size="sm" className={active ? 'text-typography-900 font-bold' : 'text-typography-500'}>{c.label}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </AccordionContent>
                            </CopilotAccordionItem>
                        </CopilotStep>
                    </Accordion>

                    {/* Configuration Inputs */}
                    <VStack className="gap-4">
                        <CopilotStep
                            text="Set the maximum total distance you are willing to travel for this itinerary."
                            order={4}
                            name="maxDistanceInput"
                        >
                            <CopilotBox className="bg-background-50 p-4 rounded-xl border border-outline-100">
                                <FormControl isInvalid={!!errors.maxDistance}>
                                    <FormControlLabel className="mb-2">
                                        <HStack className="items-center gap-2">
                                            <Icon as={Navigation2} size="sm" className="text-primary-600" />
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
                                    <FormControlHelper>
                                        <FormControlHelperText>
                                            Set the maximum total distance you are willing to travel for this itinerary.
                                        </FormControlHelperText>
                                    </FormControlHelper>
                                    <FormControlError className="mt-1">
                                        <FormControlErrorIcon as={AlertCircle} size="sm" />
                                        <FormControlErrorText size="sm">{errors.maxDistance?.message}</FormControlErrorText>
                                    </FormControlError>
                                </FormControl>
                            </CopilotBox>
                        </CopilotStep>
                        <CopilotStep
                            text="Limit the number of stopovers (landmarks) to include in your route."
                            order={5}
                            name="maxStopoverInput"
                        >
                            <CopilotBox className="bg-background-50 p-4 rounded-xl border border-outline-100">
                                <FormControl isInvalid={!!errors.maxPoi}>
                                    <FormControlLabel className="mb-2">
                                        <HStack className="items-center gap-2">
                                            <Icon as={CheckCircle2} size="sm" className="text-primary-600" />
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
                                    <FormControlHelper>
                                        <FormControlHelperText>
                                            Set the maximum number of stopovers (landmarks) to include in your route.
                                        </FormControlHelperText>
                                    </FormControlHelper>
                                    <FormControlError className="mt-1">
                                        <FormControlErrorIcon as={AlertCircle} size="sm" />
                                        <FormControlErrorText size="sm">{errors.maxPoi?.message}</FormControlErrorText>
                                    </FormControlError>
                                </FormControl>
                            </CopilotBox>
                        </CopilotStep>
                    </VStack>

                    {/* Warning Hint */}
                    {availableCount < 2 && (
                        <HStack className="mt-4 p-3 bg-warning-50 rounded-lg border border-warning-100 gap-2 items-center">
                            <Icon as={AlertCircle} size="sm" className="text-warning-600" />
                            <Text size="sm" className="text-warning-700">Select more filters to generate a valid route.</Text>
                        </HStack>
                    )}
                    <CopilotStep
                        text="Ready? Generate your smart itinerary based on the selected preferences."
                        order={6}
                        name="submitButton"
                    >
                        <CopilotBox className="bg-background-0 border-t border-outline-50 pb-8">
                            {/* Bottom Action */}
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
                        </CopilotBox>
                    </CopilotStep>

                </ScrollView>

            </KeyboardAvoidingView>
        </>
    );
};


export default function CreateWithAgamScreen() {
    return (
        <CopilotProvider
            verticalOffset={Platform.OS === 'android' ? StatusBar.currentHeight : 0}
        >
            <CreateWithAgamScreenContent />
        </CopilotProvider>
    );
}



