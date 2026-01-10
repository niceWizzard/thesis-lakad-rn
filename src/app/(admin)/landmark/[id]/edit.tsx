import { zodResolver } from '@hookform/resolvers/zod';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
    ArrowLeft,
    Camera,
    CheckCircle2,
    Globe,
    Save,
    Type
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity
} from 'react-native';
import * as z from 'zod';

import { Box } from '@/components/ui/box';
import { Button, ButtonGroup, ButtonIcon, ButtonText } from '@/components/ui/button';
import {
    FormControl
} from '@/components/ui/form-control';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { Textarea, TextareaInput } from '@/components/ui/textarea';
import { Toast, ToastTitle, useToast } from '@/components/ui/toast';
import { VStack } from '@/components/ui/vstack';

import { supabase } from '@/src/utils/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const landmarkSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    latitude: z.string().regex(/^-?\d*\.?\d*$/, "Must be a valid number"),
    longitude: z.string().regex(/^-?\d*\.?\d*$/, "Must be a valid number"),
});

type LandmarkFormData = z.infer<typeof landmarkSchema>;

export default function AdminLandmarkEditScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const toast = useToast();
    const queryClient = useQueryClient();

    // Image Management State
    const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
    const [externalUrlInput, setExternalUrlInput] = useState('');

    // This holds the preview. It could be a remote URL, a local 'file://' URI, or a base64 string.
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [pendingImageData, setPendingImageData] = useState<{ base64?: string, remoteUrl?: string } | null>(null);

    const { data: landmark, isLoading } = useQuery({
        queryKey: ['landmark', id],
        queryFn: async () => {
            const { data, error } = await supabase.from('landmark').select('*').eq('id', id as any).single();
            if (error) throw error;
            return data;
        },
        enabled: !!id,
    });

    const { control, handleSubmit, reset, formState: { errors, isDirty } } = useForm<LandmarkFormData>({
        resolver: zodResolver(landmarkSchema),
        defaultValues: { name: '', description: '', latitude: '', longitude: '' }
    });

    useEffect(() => {
        if (landmark) {
            reset({
                name: landmark.name,
                description: landmark.description || '',
                latitude: landmark.latitude.toString(),
                longitude: landmark.longitude.toString(),
            });
            setImagePreview(landmark.image_url);
        }
    }, [landmark]);

    // --- 1. PREPARE LOCAL IMAGE ---
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

    // --- 2. PREPARE REMOTE URL ---
    const handleApplyUrl = () => {
        if (externalUrlInput) {
            setImagePreview(externalUrlInput);
            setPendingImageData({ remoteUrl: externalUrlInput });
            setExternalUrlInput('');
        }
    };

    // --- 3. THE UNIFIED SAVE LOGIC ---
    const updateMutation = useMutation({
        mutationFn: async (formData: LandmarkFormData) => {
            let finalImageUrl = landmark?.image_url;

            // Only upload if the user changed the image
            if (pendingImageData) {
                let arrayBuffer: ArrayBuffer;
                let contentType: string;
                let fileExt: string;

                if (pendingImageData.base64) {
                    // Handling local file
                    arrayBuffer = decode(pendingImageData.base64);
                    contentType = 'image/jpeg';
                    fileExt = 'jpg';
                } else {
                    // Handling external URL
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
                finalImageUrl = publicUrl;


                // Delete old image
                if (landmark?.image_url) {
                    const { error: deleteError } = await supabase.storage
                        .from('landmark_images')
                        .remove([
                            landmark.image_url.replace('https://sjvzaxmomkubtnshjsni.supabase.co/storage/v1/object/public/', "")
                        ]);
                    if (deleteError)
                        throw deleteError;
                }


            }

            const { error } = await supabase
                .from('landmark')
                .update({
                    ...formData,
                    latitude: parseFloat(formData.latitude),
                    longitude: parseFloat(formData.longitude),
                    image_url: finalImageUrl,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id as any);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['landmarks'] });
            toast.show({
                placement: "top",
                render: ({ id }) => (
                    <Toast nativeID={id} action="success" variant="solid">
                        <ToastTitle>Landmark Saved Successfully</ToastTitle>
                    </Toast>
                ),
            });
            router.back();
        },
    });

    if (isLoading) return <Box className="flex-1 justify-center items-center"><ActivityIndicator size="large" /></Box>;

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-background-0">
            <Stack.Screen options={{
                headerTitle: "Edit Landmark",
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()} className="mr-4">
                        <ArrowLeft color="black" size={24} />
                    </TouchableOpacity>
                )
            }} />

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <VStack className="p-6 gap-8">

                    {/* Visual Content Section */}
                    <VStack className="gap-4">
                        <HStack className="justify-between items-center">
                            <Heading size="md">Visual Content</Heading>
                            <ButtonGroup isAttached flexDirection='row'>
                                <Button size="xs" variant={uploadMode === 'file' ? 'solid' : 'outline'} onPress={() => setUploadMode('file')}>
                                    <ButtonText>Gallery</ButtonText>
                                </Button>
                                <Button size="xs" variant={uploadMode === 'url' ? 'solid' : 'outline'} onPress={() => setUploadMode('url')}>
                                    <ButtonText>URL</ButtonText>
                                </Button>
                            </ButtonGroup>
                        </HStack>

                        <Box className="relative w-full h-64 rounded-3xl bg-background-100 overflow-hidden border border-outline-200">
                            <Image
                                source={{ uri: imagePreview || 'https://via.placeholder.com/600x400' }}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                            {uploadMode === 'file' && (
                                <Button onPress={handlePickImage} className="absolute bottom-4 right-4 rounded-2xl shadow-xl" action="primary">
                                    <ButtonIcon as={Camera} className="mr-2" />
                                    <ButtonText>Replace</ButtonText>
                                </Button>
                            )}
                        </Box>

                        {uploadMode === 'url' && (
                            <VStack className="gap-2">
                                <Input variant="outline" size="lg" className="rounded-xl overflow-hidden">
                                    <InputSlot className="pl-3"><Icon as={Globe} /></InputSlot>
                                    <InputField
                                        placeholder="Enter image URL..."
                                        value={externalUrlInput}
                                        onChangeText={setExternalUrlInput}
                                    />
                                    <Button onPress={handleApplyUrl} isDisabled={!externalUrlInput} className="rounded-none h-full">
                                        <ButtonIcon as={CheckCircle2} />
                                    </Button>
                                </Input>
                            </VStack>
                        )}
                        {pendingImageData && (
                            <Text size="xs" className="text-info-600 font-medium italic">
                                * New image selected. Changes will be uploaded upon saving.
                            </Text>
                        )}
                    </VStack>

                    {/* Core Information */}
                    <VStack className="gap-5">
                        <Heading size="md">Details</Heading>
                        <FormControl isInvalid={!!errors.name}>
                            <Text size="xs" className="font-bold text-typography-500 mb-1 ml-1">NAME</Text>
                            <Controller control={control} name="name" render={({ field: { onChange, value } }) => (
                                <Input size="lg" className="rounded-xl">
                                    <InputSlot className="pl-3"><InputIcon as={Type} /></InputSlot>
                                    <InputField value={value} onChangeText={onChange} />
                                </Input>
                            )} />
                        </FormControl>

                        <FormControl isInvalid={!!errors.description}>
                            <Text size="xs" className="font-bold text-typography-500 mb-1 ml-1">DESCRIPTION</Text>
                            <Controller control={control} name="description" render={({ field: { onChange, value } }) => (
                                <Textarea className="rounded-xl">
                                    <TextareaInput value={value} onChangeText={onChange} multiline className="h-32" />
                                </Textarea>
                            )} />
                        </FormControl>

                        <HStack space="md">
                            <Box className="flex-1">
                                <FormControl isInvalid={!!errors.latitude}>
                                    <Text size="xs" className="font-bold text-typography-500 mb-1">LATITUDE</Text>
                                    <Controller control={control} name="latitude" render={({ field: { onChange, value } }) => (
                                        <Input size="md" className="rounded-xl"><InputField value={value} onChangeText={onChange} keyboardType="numeric" /></Input>
                                    )} />
                                </FormControl>
                            </Box>
                            <Box className="flex-1">
                                <FormControl isInvalid={!!errors.longitude}>
                                    <Text size="xs" className="font-bold text-typography-500 mb-1">LONGITUDE</Text>
                                    <Controller control={control} name="longitude" render={({ field: { onChange, value } }) => (
                                        <Input size="md" className="rounded-xl"><InputField value={value} onChangeText={onChange} keyboardType="numeric" /></Input>
                                    )} />
                                </FormControl>
                            </Box>
                        </HStack>
                    </VStack>
                </VStack>
            </ScrollView>

            {/* Save Button with Mutation State */}
            <Box className="p-6 bg-white border-t border-outline-50">
                <Button
                    onPress={handleSubmit((data) => updateMutation.mutate(data))}
                    size="lg"
                    isDisabled={(!isDirty && !pendingImageData) || updateMutation.isPending}
                    className="rounded-2xl h-14"
                >
                    {updateMutation.isPending ? (
                        <ActivityIndicator color="white" className="mr-2" />
                    ) : (
                        <ButtonIcon as={Save} className="mr-2" />
                    )}
                    <ButtonText className="font-bold">
                        {updateMutation.isPending ? 'Uploading & Saving...' : 'Save Changes'}
                    </ButtonText>
                </Button>
            </Box>
        </KeyboardAvoidingView>
    );
}