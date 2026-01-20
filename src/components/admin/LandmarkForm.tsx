import { zodResolver } from '@hookform/resolvers/zod';
import Mapbox, { MapView, PointAnnotation } from '@rnmapbox/maps';
import * as ImagePicker from 'expo-image-picker';
import debounce from 'lodash.debounce';
import { AlertCircle, Camera, CheckCircle2, ChevronDown, Globe, MapPin, Navigation2, Save, Star, Tag, Type } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { Box } from '@/components/ui/box';
import { Button, ButtonGroup, ButtonIcon, ButtonText } from '@/components/ui/button';
import { FormControl, FormControlError, FormControlErrorIcon, FormControlErrorText, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { CircleIcon, Icon } from '@/components/ui/icon';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Select, SelectBackdrop, SelectContent, SelectDragIndicator, SelectDragIndicatorWrapper, SelectIcon, SelectInput, SelectItem, SelectPortal, SelectTrigger } from '@/components/ui/select';
import { VStack } from '@/components/ui/vstack';

import { AlertDialog, AlertDialogBackdrop, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader } from '@/components/ui/alert-dialog';
import { Modal, ModalBackdrop, ModalBody, ModalCloseButton, ModalContent, ModalHeader } from '@/components/ui/modal';
import { Radio, RadioGroup, RadioIcon, RadioIndicator, RadioLabel } from '@/components/ui/radio';
import { Text } from '@/components/ui/text';
import { Textarea, TextareaInput } from '@/components/ui/textarea';
import { DISTRICT_TO_MUNICIPALITY_MAP } from '@/src/constants/jurisdictions';
import { LANDMARK_TYPES } from '@/src/constants/type';
import { Landmark, LandmarkDistrict } from '@/src/model/landmark.types';
import { createAndEditLandmarkSchema } from '@/src/schema/landmark';
import { useNavigation, useRouter } from 'expo-router';
import * as z from 'zod';

type FormData = z.infer<typeof createAndEditLandmarkSchema>;

interface LandmarkFormProps {
    initialData?: Landmark;
    onSubmit: (data: FormData, pendingImage: { base64?: string; remoteUrl?: string } | null) => Promise<void>;
    isUpdating: boolean;
    submitLabel: string;
    onDirtyChange?: (isDirty: boolean) => void;
    disregardDiscardDialog?: boolean;
}

export function LandmarkForm({
    initialData, onSubmit,
    submitLabel,
    onDirtyChange,
    isUpdating,
    disregardDiscardDialog,
}:
    LandmarkFormProps) {
    const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
    const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image_url || null);
    const [pendingImageData, setPendingImageData] = useState<{ base64?: string, remoteUrl?: string } | null>(null);
    const [isVerifyingUrl, setIsVerifyingUrl] = useState(false);
    const [showDiscardAlert, setShowDiscardAlert] = useState(false);
    const router = useRouter();
    const navigation = useNavigation();


    const { control, handleSubmit, watch, setValue, getValues, formState: { errors, isDirty, isValid }, reset } = useForm<FormData>({
        resolver: zodResolver(createAndEditLandmarkSchema),
        mode: "onChange",
        defaultValues: initialData ? {
            ...initialData,
            latitude: initialData.latitude.toString(),
            longitude: initialData.longitude.toString(),
            gmaps_rating: initialData.gmaps_rating.toString(),
            description: initialData.description || '',
            externalImageUrl: '',
        } : {
            name: '',
            type: undefined,
            district: undefined,
            municipality: undefined,
            description: '', latitude: '', longitude: '', gmaps_rating: '0', externalImageUrl: '',
        }
    });

    const latitude = watch('latitude');
    const longitude = watch('longitude');
    const selectedDistrict = watch('district');

    const hasUnsavedChanges = isDirty || !!pendingImageData;


    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            if (!hasUnsavedChanges || disregardDiscardDialog) return;
            e.preventDefault();
            setShowDiscardAlert(true);
        });
        return unsubscribe;
    }, [navigation, hasUnsavedChanges, disregardDiscardDialog]);

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.7, base64: true,
        });
        if (!result.canceled) {
            setImagePreview(result.assets[0].uri);
            setPendingImageData({ base64: result.assets[0].base64! });
        }
    };

    const handleUrlChange = debounce(async (url: string) => {
        if (!url.startsWith('http')) return setIsVerifyingUrl(false);
        try {
            const res = await fetch(url, { method: 'HEAD' });
            const isImg = res.headers.get('Content-Type')?.startsWith('image/');
            if (isImg) {
                setImagePreview(url);
                setPendingImageData({ remoteUrl: url });
            }
        } finally {
            setIsVerifyingUrl(false);
        }
    }, 600);

    const handleFormSubmit = (data: FormData) => {
        onSubmit(data, pendingImageData)
    }

    return (
        <>
            <AlertDialog isOpen={showDiscardAlert} onClose={() => setShowDiscardAlert(false)}>
                <AlertDialogBackdrop />
                <AlertDialogContent>
                    <AlertDialogHeader><Heading size="lg">Unsaved Changes</Heading></AlertDialogHeader>
                    <AlertDialogBody className='py-4'>
                        <Text size="sm">Are you sure you want to discard your edits?</Text>
                    </AlertDialogBody>
                    <AlertDialogFooter>
                        <ButtonGroup space="lg" flexDirection='row'>
                            <Button variant="outline" action="secondary" onPress={() => setShowDiscardAlert(false)}><ButtonText>Stay</ButtonText></Button>
                            <Button action="negative" onPress={() => {
                                setShowDiscardAlert(false); setPendingImageData(null); reset(); router.back();
                            }}
                            >
                                <ButtonText>Discard</ButtonText>
                            </Button>
                        </ButtonGroup>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Modal isOpen={isUpdating} >
                <ModalBackdrop />
                <ModalContent>
                    <ModalHeader>
                        <Heading>Saving changes...</Heading>
                        <ModalCloseButton></ModalCloseButton>
                    </ModalHeader>
                    <ModalBody>
                        <ActivityIndicator size="large" color="#0891b2" />
                    </ModalBody>
                </ModalContent>
            </Modal>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="bg-background-0"
                style={{ flex: 1 }}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="always"
                >
                    <VStack className="p-6 gap-8 flex-1 mb-24">
                        <VStack className="gap-4">
                            <HStack className="justify-between items-center">
                                <Heading size="md">Visual Content</Heading>
                                <ButtonGroup isAttached flexDirection='row'>
                                    <Button size="xs" variant={uploadMode === 'file' ? 'solid' : 'outline'} onPress={() => setUploadMode('file')}><ButtonText>Gallery</ButtonText></Button>
                                    <Button size="xs" variant={uploadMode === 'url' ? 'solid' : 'outline'} onPress={() => setUploadMode('url')}><ButtonText>URL</ButtonText></Button>
                                </ButtonGroup>
                            </HStack>

                            <Box className="relative w-full h-64 rounded-3xl bg-background-100 overflow-hidden border border-outline-200">
                                {imagePreview ? (
                                    <Image source={{ uri: imagePreview }} className="w-full h-full" resizeMode="cover" />
                                ) : (
                                    <VStack className="w-full h-full items-center justify-center gap-2">
                                        <Icon as={Camera} size="xl" className="text-typography-300" />
                                        <Text size="sm" className="text-typography-400">Preview will appear here</Text>
                                    </VStack>
                                )}
                                {uploadMode === 'file' && (
                                    <Button onPress={handlePickImage} className="absolute bottom-4 right-4 rounded-2xl shadow-xl" action="primary">
                                        <ButtonIcon as={Camera} className="mr-2" />
                                        <ButtonText>Replace Photo</ButtonText>
                                    </Button>
                                )}
                            </Box>

                            {uploadMode === 'url' && (
                                <FormControl isInvalid={!!errors.externalImageUrl}>
                                    <FormControlLabel className="mb-1">
                                        <FormControlLabelText size="xs" className="uppercase font-bold">Image URL</FormControlLabelText>
                                    </FormControlLabel>
                                    <Controller
                                        control={control}
                                        name="externalImageUrl"
                                        render={({ field: { onChange, value } }) => (
                                            <Input variant="outline" size="lg" className="rounded-xl overflow-hidden">
                                                <InputSlot className="pl-3">
                                                    {isVerifyingUrl ? <ActivityIndicator size="small" color="#0891b2" /> : <Icon as={Globe} className={imagePreview === value && value !== "" ? "text-success-500" : ""} />}
                                                </InputSlot>
                                                <InputField
                                                    placeholder="https://example.com/image.jpg"
                                                    value={value}
                                                    onChangeText={(text) => {
                                                        onChange(text);
                                                        setIsVerifyingUrl(true);
                                                        handleUrlChange(text);
                                                    }}
                                                />
                                                {imagePreview === value && value !== "" && !isVerifyingUrl && (
                                                    <InputSlot className="pr-3"><Icon as={CheckCircle2} size="sm" className="text-success-500" /></InputSlot>
                                                )}
                                            </Input>
                                        )}
                                    />
                                    <FormControlError>
                                        <FormControlErrorIcon as={AlertCircle} />
                                        <FormControlErrorText>{errors.externalImageUrl?.message}</FormControlErrorText>
                                    </FormControlError>
                                </FormControl>
                            )}
                        </VStack>

                        <VStack className="gap-5">
                            <Heading size="md">Landmark Details</Heading>

                            <FormControl isInvalid={!!errors.name}>
                                <FormControlLabel className="mb-1">
                                    <FormControlLabelText size="xs" className="uppercase font-bold">Official Name</FormControlLabelText>
                                </FormControlLabel>
                                <Controller control={control} name="name" render={({ field: { onChange, value } }) => (
                                    <Input size="lg" className="rounded-xl"><InputSlot className="pl-3"><InputIcon as={Type} /></InputSlot><InputField value={value} onChangeText={onChange} /></Input>
                                )} />
                                <FormControlError><FormControlErrorIcon as={AlertCircle} /><FormControlErrorText>{errors.name?.message}</FormControlErrorText></FormControlError>
                            </FormControl>

                            <HStack space="md">
                                <VStack className="flex-1">
                                    <FormControl isInvalid={!!errors.district}>
                                        <FormControlLabel className="mb-1">
                                            <FormControlLabelText size="xs" className="uppercase font-bold">District</FormControlLabelText>
                                        </FormControlLabel>
                                        <Controller control={control} name="district" render={({ field: { onChange, value } }) => (
                                            <Select selectedValue={value} onValueChange={(val) => {
                                                onChange(val);
                                                setValue('municipality', getValues('municipality'), { shouldValidate: true, shouldDirty: true });
                                            }}>
                                                <SelectTrigger size="lg" className="rounded-xl"><SelectInput placeholder="District" /><SelectIcon className="mr-3" as={ChevronDown} /></SelectTrigger>
                                                <SelectPortal>
                                                    <SelectBackdrop />
                                                    <SelectContent>
                                                        <SelectDragIndicatorWrapper>
                                                            <SelectDragIndicator />
                                                        </SelectDragIndicatorWrapper>
                                                        {Object.keys(DISTRICT_TO_MUNICIPALITY_MAP).map((d) => <SelectItem
                                                            key={d} label={d} value={d}
                                                        />)}
                                                    </SelectContent></SelectPortal>
                                            </Select>
                                        )} />
                                    </FormControl>
                                </VStack>
                                <VStack className="flex-1">
                                    <FormControl isInvalid={!!errors.municipality}>
                                        <FormControlLabel className="mb-1">
                                            <FormControlLabelText size="xs" className="uppercase font-bold">Municipality</FormControlLabelText>
                                        </FormControlLabel>
                                        <Controller control={control} name="municipality" render={({ field: { onChange, value } }) => (
                                            <Select selectedValue={value} onValueChange={onChange} isDisabled={!selectedDistrict}>
                                                <SelectTrigger size="lg" className="rounded-xl"><SelectInput placeholder="Town" />
                                                    <SelectIcon className="mr-3" as={ChevronDown} />
                                                </SelectTrigger>
                                                <SelectPortal><SelectBackdrop /><SelectContent><SelectDragIndicatorWrapper><SelectDragIndicator /></SelectDragIndicatorWrapper>
                                                    {(DISTRICT_TO_MUNICIPALITY_MAP[selectedDistrict as LandmarkDistrict] || []).map((m) => (
                                                        <SelectItem key={m} label={m} value={m} />
                                                    ))}
                                                </SelectContent></SelectPortal>
                                            </Select>
                                        )} />
                                        <FormControlError><FormControlErrorIcon as={AlertCircle} /><FormControlErrorText>{errors.municipality?.message}</FormControlErrorText></FormControlError>
                                    </FormControl>
                                </VStack>
                            </HStack>

                            <FormControl isInvalid={!!errors.gmaps_rating}>
                                <FormControlLabel className="mb-1">
                                    <FormControlLabelText size="xs" className="uppercase font-bold">GMaps Rating (0-5)</FormControlLabelText>
                                </FormControlLabel>
                                <Controller control={control} name="gmaps_rating" render={({ field: { onChange, value } }) => (
                                    <Input size="lg" className="rounded-xl"><InputSlot className="pl-3"><Icon as={Star} size="sm" className="text-warning-500" /></InputSlot><InputField value={value} onChangeText={onChange} keyboardType="numeric" /></Input>
                                )} />
                                <FormControlError><FormControlErrorIcon as={AlertCircle} /><FormControlErrorText>{errors.gmaps_rating?.message}</FormControlErrorText></FormControlError>
                            </FormControl>

                            <FormControl isInvalid={!!errors.type}>
                                <FormControlLabel className="mb-1">
                                    <HStack className="items-center gap-2">
                                        <Icon as={Tag} size="xs" />
                                        <FormControlLabelText size="xs" className="uppercase font-bold">Categories</FormControlLabelText>
                                    </HStack>
                                </FormControlLabel>
                                <Box className="bg-background-50 p-4 rounded-2xl border border-outline-100">
                                    <Controller control={control} name="type" render={({ field: { onChange, value } }) => (
                                        <RadioGroup value={value} onChange={onChange}>
                                            <VStack className="gap-3">{LANDMARK_TYPES.map((type) => (
                                                <Radio key={type} value={type} size="md" aria-label={type}>
                                                    <RadioIndicator>
                                                        <RadioIcon as={CircleIcon} />
                                                    </RadioIndicator>
                                                    <RadioLabel className="ml-2">
                                                        {type}
                                                    </RadioLabel>
                                                </Radio>
                                            ))}</VStack>
                                        </RadioGroup>
                                    )} />
                                </Box>
                            </FormControl>

                            <FormControl isInvalid={!!errors.description}>
                                <FormControlLabel className="mb-1">
                                    <FormControlLabelText size="xs" className="uppercase font-bold">Description</FormControlLabelText>
                                </FormControlLabel>
                                <Controller control={control} name="description" render={({ field: { onChange, value } }) => (
                                    <Textarea className="rounded-xl">
                                        <TextareaInput value={value} onChangeText={onChange} multiline className="h-32" /></Textarea>
                                )} />
                                <FormControlError><FormControlErrorIcon as={AlertCircle} /><FormControlErrorText>{errors.description?.message}</FormControlErrorText></FormControlError>
                            </FormControl>

                            <View
                            >
                                <Heading size='xs' className='uppercase mb-4'>
                                    Coordinates</Heading>
                                {
                                    longitude && latitude && (
                                        <MapView
                                            style={{
                                                height: 480
                                            }}
                                            scrollEnabled={false}
                                            zoomEnabled={false}
                                            pitchEnabled={false}
                                            rotateEnabled={false}
                                        >
                                            <Mapbox.Camera
                                                defaultSettings={{
                                                    centerCoordinate: [Number.parseFloat(longitude), Number.parseFloat(latitude)],
                                                    zoomLevel: 20,
                                                }}
                                                animationDuration={1000}
                                                centerCoordinate={[
                                                    Number.parseFloat(longitude) || 0,
                                                    Number.parseFloat(latitude) || 0
                                                ]}
                                                zoomLevel={15}
                                            />
                                            <PointAnnotation
                                                id='point'
                                                coordinate={[
                                                    Number.parseFloat(longitude) || 0,
                                                    Number.parseFloat(latitude) || 0
                                                ]}
                                            >
                                                <Box className="h-8 w-8 bg-primary-500 rounded-full border-2 border-white items-center justify-center shadow-lg">
                                                    <Icon as={MapPin} className="text-white" size="xs" />
                                                </Box>
                                            </PointAnnotation>
                                        </MapView>
                                    )
                                }
                            </View>

                            <HStack space="md">
                                <Box className="flex-1">
                                    <FormControl isInvalid={!!errors.latitude}>
                                        <FormControlLabel className="mb-1">
                                            <FormControlLabelText size="xs" className="uppercase font-bold">Latitude</FormControlLabelText>
                                        </FormControlLabel>
                                        <Controller control={control} name="latitude" render={({ field: { onChange, value } }) => (
                                            <Input size="md" className="rounded-xl"><InputSlot className="pl-3"><Icon as={Navigation2} size="sm" /></InputSlot><InputField value={value} onChangeText={onChange} keyboardType="numeric" /></Input>
                                        )} />
                                        <FormControlError><FormControlErrorIcon as={AlertCircle} /><FormControlErrorText>{errors.latitude?.message}</FormControlErrorText></FormControlError>
                                    </FormControl>
                                </Box>
                                <Box className="flex-1">
                                    <FormControl isInvalid={!!errors.longitude}>
                                        <FormControlLabel className="mb-1">
                                            <FormControlLabelText size="xs" className="uppercase font-bold">Longitude</FormControlLabelText>
                                        </FormControlLabel>
                                        <Controller control={control} name="longitude" render={({ field: { onChange, value } }) => (
                                            <Input size="md" className="rounded-xl"><InputSlot className="pl-3"><Icon as={MapPin} size="sm" /></InputSlot><InputField value={value} onChangeText={onChange} keyboardType="numeric" /></Input>
                                        )} />
                                        <FormControlError><FormControlErrorIcon as={AlertCircle} /><FormControlErrorText>{errors.longitude?.message}</FormControlErrorText></FormControlError>
                                    </FormControl>
                                </Box>
                            </HStack>


                        </VStack>
                    </VStack>
                </ScrollView>

                <Box className="p-6 bg-background-50 border-t border-outline-50">
                    <Button
                        onPress={handleSubmit(handleFormSubmit)}
                        size="lg"
                        isDisabled={(!isDirty && !pendingImageData) || !isValid || isUpdating}
                        className="rounded-2xl h-14"
                    >
                        {isUpdating ? <ActivityIndicator color="white" className="mr-2" /> : <ButtonIcon as={Save} className="mr-2" />}
                        <ButtonText className="font-bold">{submitLabel}</ButtonText>
                    </Button>
                </Box>
            </KeyboardAvoidingView >
        </>
    );
}