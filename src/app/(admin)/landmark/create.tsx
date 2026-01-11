import { zodResolver } from '@hookform/resolvers/zod';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRouter } from 'expo-router';
import {
    AlertCircle,
    Camera,
    CheckCircle2,
    ChevronDown,
    Globe,
    MapPin,
    Navigation2,
    Plus,
    Star,
    Tag,
    Type
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView
} from 'react-native';
import * as z from 'zod';

import {
    AlertDialog,
    AlertDialogBackdrop,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
} from '@/components/ui/alert-dialog';
import { Box } from '@/components/ui/box';
import { Button, ButtonGroup, ButtonIcon, ButtonText } from '@/components/ui/button';
import {
    Checkbox,
    CheckboxGroup,
    CheckboxIcon,
    CheckboxIndicator,
    CheckboxLabel,
} from '@/components/ui/checkbox';
import {
    FormControl,
    FormControlError,
    FormControlErrorIcon,
    FormControlErrorText,
    FormControlLabel,
    FormControlLabelText
} from '@/components/ui/form-control';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { CheckIcon, Icon } from '@/components/ui/icon';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import {
    Select,
    SelectBackdrop,
    SelectContent,
    SelectDragIndicator,
    SelectDragIndicatorWrapper,
    SelectIcon,
    SelectInput,
    SelectItem,
    SelectPortal,
    SelectTrigger,
} from '@/components/ui/select';
import { Text } from '@/components/ui/text';
import { Textarea, TextareaInput } from '@/components/ui/textarea';
import { Toast, ToastTitle, useToast } from '@/components/ui/toast';
import { VStack } from '@/components/ui/vstack';

import { LANDMARK_CATEGORIES } from '@/src/constants/categories';
import { DISTRICT_TO_MUNICIPALITY_MAP } from '@/src/constants/jurisdictions';
import { LandmarkDistrict } from '@/src/model/landmark.types';
import { createAndEditLandmarkSchema } from '@/src/schema/landmark';
import { supabase } from '@/src/utils/supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash.debounce';


const editLandmarkSchema = createAndEditLandmarkSchema.extend({
    externalImageUrl: z.url({ message: "Please enter a valid URL (include http://)" })
        .optional()
        .or(z.literal(''))
});

type CreateFormData = z.infer<typeof editLandmarkSchema>;

export default function AdminLandmarkCreateScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const toast = useToast();
    const queryClient = useQueryClient();

    const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [pendingImageData, setPendingImageData] = useState<{ base64?: string, remoteUrl?: string } | null>(null);
    const [showDiscardAlert, setShowDiscardAlert] = useState(false);
    const [isVerifyingUrl, setIsVerifyingUrl] = useState(false);

    const { control, handleSubmit, reset, watch, setValue, formState: { errors, isValid, isDirty }, getValues } = useForm<CreateFormData>({
        resolver: zodResolver(editLandmarkSchema),
        mode: "onChange",
        defaultValues: {
            name: '',
            categories: [],
            district: undefined,
            municipality: undefined,
            description: '',
            latitude: '',
            longitude: '',
            gmaps_rating: '0',
            externalImageUrl: undefined,
        }
    });

    const externalUrlInput = watch('externalImageUrl')

    const selectedDistrict = watch('district');
    const hasStartedEntry = isDirty || !!pendingImageData || externalUrlInput && externalUrlInput.length > 0;

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            if (!hasStartedEntry) return;
            e.preventDefault();
            setShowDiscardAlert(true);
        });
        return unsubscribe;
    }, [navigation, hasStartedEntry]);

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
            base64: true,
        });

        if (!result.canceled) {
            setImagePreview(result.assets[0].uri);
            setPendingImageData({ base64: result.assets[0].base64! });
        }
    };

    const isImageUrl = async (url: string): Promise<boolean> => {
        try {
            console.log("FETCHING ", url)
            const response = await fetch(url, { method: 'HEAD' });
            const contentType = response.headers.get('Content-Type');
            return contentType?.startsWith('image/') ?? false;
        } catch {
            return false;
        }
    };

    const handleUrlChange = debounce(async (url: string) => {
        setTimeout(async () => {
            const valid = await isImageUrl(url);
            console.log("CHECKED ", valid, url)
            setIsVerifyingUrl(false);

            if (valid) {
                setImagePreview(url);
                setPendingImageData({ remoteUrl: url });
            } else {
                // Optional: clear preview if the link becomes invalid
                console.log("LKSDJF")
                setImagePreview(null);
                setPendingImageData(null);
            }
        }, 10)
    }, 600);

    const createMutation = useMutation({
        mutationFn: async (formData: CreateFormData) => {
            if (!pendingImageData) throw new Error("Please select an image first");

            let arrayBuffer: ArrayBuffer;
            let contentType: string;
            let fileExt: string;

            if (pendingImageData.base64) {
                arrayBuffer = decode(pendingImageData.base64);
                contentType = 'image/jpeg';
                fileExt = 'jpg';
            } else {
                const response = await fetch(pendingImageData.remoteUrl!);
                const blob = await response.blob();
                arrayBuffer = await new Response(blob).arrayBuffer();
                contentType = blob.type || 'image/jpeg';
                fileExt = pendingImageData.remoteUrl!.split('.').pop()?.split(/[?#]/)[0] || 'jpg';
            }

            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `landmarks/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('landmark_images')
                .upload(filePath, arrayBuffer, { contentType });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('landmark_images').getPublicUrl(filePath);

            const { error: dbError } = await supabase
                .from('landmark')
                .insert([{
                    name: formData.name,
                    description: formData.description,
                    latitude: parseFloat(formData.latitude),
                    longitude: parseFloat(formData.longitude),
                    categories: formData.categories,
                    district: formData.district,
                    municipality: formData.municipality,
                    gmaps_rating: parseFloat(formData.gmaps_rating || '0'),
                    image_url: publicUrl,
                    created_at: new Date().toISOString(),
                }]);

            if (dbError) throw dbError;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['landmarks'] });
            setPendingImageData(null);
            reset();
            toast.show({
                placement: "top",
                render: ({ id }) => (
                    <Toast nativeID={id} action="success" variant="solid">
                        <ToastTitle>Landmark Published!</ToastTitle>
                    </Toast>
                ),
            });
            router.back();
        },
        onError: (error: any) => {
            alert(error.message || "Failed to create landmark");
        }
    });

    return (

        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-background-0"
        >


            <AlertDialog isOpen={showDiscardAlert} onClose={() => setShowDiscardAlert(false)}>
                <AlertDialogBackdrop />
                <AlertDialogContent>
                    <AlertDialogHeader><Heading size="lg">Discard Progress?</Heading></AlertDialogHeader>
                    <AlertDialogBody><Text size="sm">You have unsaved information. Are you sure you want to exit?</Text></AlertDialogBody>
                    <AlertDialogFooter>
                        <ButtonGroup space="lg" flexDirection="row">
                            <Button variant="outline" action="secondary" onPress={() => setShowDiscardAlert(false)}><ButtonText>Stay</ButtonText></Button>
                            <Button action="negative" onPress={() => { setShowDiscardAlert(false); reset(); setPendingImageData(null); router.back(); }}><ButtonText>Discard</ButtonText></Button>
                        </ButtonGroup>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Modal transparent visible={createMutation.isPending} animationType="fade">
                <Box className="flex-1 bg-black/50 justify-center items-center">
                    <VStack className="bg-background-100 p-8 rounded-3xl items-center gap-4 shadow-lg">
                        <ActivityIndicator size="large" color="#0891b2" />
                        <Text className="font-bold text-lg text-center">Publishing Landmark...</Text>
                    </VStack>
                </Box>
            </Modal>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <VStack className="p-6 gap-8">
                    <VStack className="gap-4">
                        <HStack className="justify-between items-center">
                            <Heading size="md">Visual Content</Heading>
                            <ButtonGroup isAttached flexDirection="row">
                                <Button size="xs" variant={uploadMode === 'file' ? 'solid' : 'outline'} onPress={() => setUploadMode('file')}><ButtonText>Gallery</ButtonText></Button>
                                <Button size="xs" variant={uploadMode === 'url' ? 'solid' : 'outline'} onPress={() => setUploadMode('url')}><ButtonText>URL</ButtonText></Button>
                            </ButtonGroup>
                        </HStack>

                        <Box className="relative w-full h-64 rounded-3xl bg-background-100 overflow-hidden border border-outline-200">
                            {imagePreview ? <Image source={{ uri: imagePreview }} className="w-full h-full" resizeMode="cover" /> : <VStack className="w-full h-full items-center justify-center gap-2"><Icon as={Camera} size="xl" className="text-typography-300" /><Text size="sm" className="text-typography-400">Preview will appear here</Text></VStack>}
                            {uploadMode === 'file' && <Button onPress={handlePickImage} className="absolute bottom-4 right-4 rounded-2xl shadow-xl" action="primary"><ButtonIcon as={Camera} className="mr-2" /><ButtonText>{imagePreview ? 'Change' : 'Select'} Photo</ButtonText></Button>}
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
                                                {isVerifyingUrl ? <ActivityIndicator size="small" color="#0891b2" /> : <Icon as={Globe} className={imagePreview === externalUrlInput ? "text-success-500" : ""} />}
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
                                            {imagePreview && imagePreview === externalUrlInput && !isVerifyingUrl && (
                                                <InputSlot className="pr-3"><Icon as={CheckCircle2} size="sm" className="text-success-500" /></InputSlot>
                                            )}
                                        </Input>
                                    )}
                                />
                                <FormControlError><FormControlErrorIcon as={AlertCircle} /><FormControlErrorText>{errors.externalImageUrl?.message}</FormControlErrorText></FormControlError>
                            </FormControl>
                        )}
                    </VStack>

                    <VStack className="gap-5">
                        <Heading size="md">Landmark Details</Heading>

                        {/* Official Name */}
                        <FormControl isInvalid={!!errors.name}>
                            <FormControlLabel className="mb-1">
                                <FormControlLabelText size="xs" className="uppercase font-bold">Official Name</FormControlLabelText>
                            </FormControlLabel>
                            <Controller
                                control={control}
                                name="name"
                                render={({ field: { onChange, value } }) => (
                                    <Input size="lg" className="rounded-xl">
                                        <InputSlot className="pl-3"><InputIcon as={Type} /></InputSlot>
                                        <InputField placeholder="e.g. Barasoain Church" value={value} onChangeText={onChange} />
                                    </Input>
                                )}
                            />
                            <FormControlError><FormControlErrorIcon as={AlertCircle} /><FormControlErrorText>{errors.name?.message}</FormControlErrorText></FormControlError>
                        </FormControl>

                        <HStack space="md">
                            {/* District */}
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
                                            <SelectPortal><SelectBackdrop /><SelectContent><SelectDragIndicatorWrapper><SelectDragIndicator /></SelectDragIndicatorWrapper>
                                                {Object.keys(DISTRICT_TO_MUNICIPALITY_MAP).map((d) => <SelectItem key={d} label={d} value={d} />)}
                                            </SelectContent></SelectPortal>
                                        </Select>
                                    )} />
                                </FormControl>
                            </VStack>

                            {/* Municipality */}
                            <VStack className="flex-1">
                                <FormControl isInvalid={!!errors.municipality}>
                                    <FormControlLabel className="mb-1">
                                        <FormControlLabelText size="xs" className="uppercase font-bold">Municipality</FormControlLabelText>
                                    </FormControlLabel>
                                    <Controller control={control} name="municipality" render={({ field: { onChange, value } }) => (
                                        <Select selectedValue={value} onValueChange={onChange} isDisabled={!selectedDistrict}>
                                            <SelectTrigger size="lg" className="rounded-xl"><SelectInput placeholder="Town" /><SelectIcon className="mr-3" as={ChevronDown} /></SelectTrigger>
                                            <SelectPortal><SelectBackdrop /><SelectContent><SelectDragIndicatorWrapper><SelectDragIndicator /></SelectDragIndicatorWrapper>
                                                {(DISTRICT_TO_MUNICIPALITY_MAP[selectedDistrict as LandmarkDistrict] || []).map((m) => (
                                                    <SelectItem key={m} label={m.replace("_", " ")} value={m} />
                                                ))}
                                            </SelectContent></SelectPortal>
                                        </Select>
                                    )} />
                                    <FormControlError><FormControlErrorIcon as={AlertCircle} /><FormControlErrorText>{errors.municipality?.message}</FormControlErrorText></FormControlError>
                                </FormControl>
                            </VStack>
                        </HStack>

                        {/* GMaps Rating */}
                        <FormControl isInvalid={!!errors.gmaps_rating}>
                            <FormControlLabel className="mb-1">
                                <FormControlLabelText size="xs" className="uppercase font-bold">GMaps Rating (0-5)</FormControlLabelText>
                            </FormControlLabel>
                            <Controller control={control} name="gmaps_rating" render={({ field: { onChange, value } }) => (
                                <Input size="lg" className="rounded-xl"><InputSlot className="pl-3"><Icon as={Star} size="sm" className="text-warning-500" /></InputSlot><InputField value={value} onChangeText={onChange} keyboardType="numeric" placeholder="4.5" /></Input>
                            )} />
                            <FormControlError><FormControlErrorIcon as={AlertCircle} /><FormControlErrorText>{errors.gmaps_rating?.message}</FormControlErrorText></FormControlError>
                        </FormControl>

                        {/* Categories */}
                        <FormControl isInvalid={!!errors.categories}>
                            <FormControlLabel className="mb-1">
                                <HStack className="items-center gap-2"><Icon as={Tag} size="xs" /><FormControlLabelText size="xs" className="uppercase font-bold">Categories</FormControlLabelText></HStack>
                            </FormControlLabel>
                            <Box className="bg-background-50 p-4 rounded-2xl border border-outline-100">
                                <Controller control={control} name="categories" render={({ field: { onChange, value } }) => (
                                    <CheckboxGroup value={value} onChange={onChange}>
                                        <VStack className="gap-3">{LANDMARK_CATEGORIES.map((cat) => (<Checkbox key={cat} value={cat} size="md" aria-label={cat}><CheckboxIndicator><CheckboxIcon as={CheckIcon} /></CheckboxIndicator><CheckboxLabel className="ml-2">{cat}</CheckboxLabel></Checkbox>))}</VStack>
                                    </CheckboxGroup>
                                )} />
                            </Box>
                        </FormControl>

                        {/* Description */}
                        <FormControl isInvalid={!!errors.description}>
                            <FormControlLabel className="mb-1">
                                <FormControlLabelText size="xs" className="uppercase font-bold">Description</FormControlLabelText>
                            </FormControlLabel>
                            <Controller control={control} name="description" render={({ field: { onChange, value } }) => (
                                <Textarea className="rounded-xl"><TextareaInput placeholder="Historical background..." value={value} onChangeText={onChange} multiline className="h-32" /></Textarea>
                            )} />
                            <FormControlError><FormControlErrorIcon as={AlertCircle} /><FormControlErrorText>{errors.description?.message}</FormControlErrorText></FormControlError>
                        </FormControl>

                        {/* Coordinates */}
                        <HStack space="md">
                            <Box className="flex-1">
                                <FormControl isInvalid={!!errors.latitude}>
                                    <FormControlLabel className="mb-1">
                                        <FormControlLabelText size="xs" className="uppercase font-bold">Latitude</FormControlLabelText>
                                    </FormControlLabel>
                                    <Controller control={control} name="latitude" render={({ field: { onChange, value } }) => (
                                        <Input size="md" className="rounded-xl"><InputSlot className="pl-3"><Icon as={Navigation2} size="sm" /></InputSlot><InputField value={value} onChangeText={onChange} keyboardType="numeric" placeholder="14.8..." /></Input>
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
                                        <Input size="md" className="rounded-xl"><InputSlot className="pl-3"><Icon as={MapPin} size="sm" /></InputSlot><InputField value={value} onChangeText={onChange} keyboardType="numeric" placeholder="120.8..." /></Input>
                                    )} />
                                    <FormControlError><FormControlErrorIcon as={AlertCircle} /><FormControlErrorText>{errors.longitude?.message}</FormControlErrorText></FormControlError>
                                </FormControl>
                            </Box>
                        </HStack>
                    </VStack>
                </VStack>
            </ScrollView>

            <Box className="p-6 bg-background-50 border-t border-outline-50">
                <Button onPress={handleSubmit((data) => createMutation.mutate(data))} size="lg" isDisabled={!isValid || !imagePreview || createMutation.isPending} className="rounded-2xl h-14">
                    {createMutation.isPending ? <ActivityIndicator color="white" className="mr-2" /> : <ButtonIcon as={Plus} className="mr-2" />}
                    <ButtonText className="font-bold">{createMutation.isPending ? 'Publishing...' : 'Publish Landmark'}</ButtonText>
                </Button>
            </Box>
        </KeyboardAvoidingView>
    );
}