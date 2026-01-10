import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
    ArrowLeft,
    Image as ImageIcon,
    Navigation2,
    Save,
    Type
} from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Image, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import * as z from 'zod';

import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { Textarea, TextareaInput } from '@/components/ui/textarea';
import { Toast, ToastDescription, ToastTitle, useToast } from '@/components/ui/toast';
import { VStack } from '@/components/ui/vstack';

import { fetchLandmarkById } from '@/src/utils/fetchLandmarks';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// --- Validation Schema ---
const landmarkSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    description: z.string().min(10, "Description is too short"),
    latitude: z.string().refine(val => !isNaN(parseFloat(val)), "Invalid latitude"),
    longitude: z.string().refine(val => !isNaN(parseFloat(val)), "Invalid longitude"),
    imageUrl: z.string().url("Must be a valid image URL").optional().or(z.literal('')),
});

type LandmarkFormData = z.infer<typeof landmarkSchema>;

export default function AdminLandmarkEditScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const toast = useToast();
    const queryClient = useQueryClient();

    const { data: landmark, isLoading } = useQuery({
        queryKey: ['landmark', id],
        queryFn: () => fetchLandmarkById(Number.parseInt(id!.toString())),
        enabled: !!id,
    });

    const { control, handleSubmit, reset, formState: { errors, isDirty } } = useForm<LandmarkFormData>({
        resolver: zodResolver(landmarkSchema),
        defaultValues: {
            name: '',
            description: '',
            latitude: '',
            longitude: '',
            imageUrl: '',
        }
    });

    // Populate form when data is fetched
    useEffect(() => {
        if (landmark) {
            console.log(landmark.latitude)
            reset({
                name: landmark.name,
                description: landmark.description || '',
                latitude: landmark.latitude.toString(),
                longitude: landmark.longitude.toString(),
                imageUrl: landmark.image_url || '',
            });
        }
    }, [landmark]);

    const onSave = (data: LandmarkFormData) => {
        // Mocking the update logic
        console.log("Saving Data: ", data);

        // Show success toast
        toast.show({
            placement: "top",
            render: ({ id }) => (
                <Toast nativeID={id} action="success" variant="solid">
                    <ToastTitle>Landmark Updated</ToastTitle>
                    <ToastDescription>Changes have been pushed to the database.</ToastDescription>
                </Toast>
            ),
        });

        router.back();
    };

    if (isLoading) return <Box className="flex-1 justify-center items-center"><Text>Loading Form...</Text></Box>;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-background-0"
        >
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

                    {/* 1. Image Edit Section */}
                    <VStack className="gap-4">
                        <Heading size="md">Cover Image</Heading>
                        <Box className="relative w-full h-48 rounded-3xl bg-background-100 overflow-hidden border border-outline-100">
                            <Image
                                source={{ uri: 'https://via.placeholder.com/600x400' }}
                                className="w-full h-full opacity-60"
                                resizeMode="cover"
                            />
                            <TouchableOpacity className="absolute inset-0 items-center justify-center bg-black/20">
                                <VStack className="items-center gap-2">
                                    <Icon as={ImageIcon} color="white" size="xl" />
                                    <Text className="text-white font-bold">Change Photo</Text>
                                </VStack>
                            </TouchableOpacity>
                        </Box>
                        <Controller
                            control={control}
                            name="imageUrl"
                            render={({ field: { onChange, value } }) => (
                                <Input variant="outline" size="md">
                                    <InputField placeholder="Image URL (Supabase/S3)" value={value} onChangeText={onChange} />
                                </Input>
                            )}
                        />
                    </VStack>

                    {/* 2. Basic Info Section */}
                    <VStack className="gap-4">
                        <Heading size="md">Details</Heading>

                        {/* Name Input */}
                        <VStack className="gap-2">
                            <Text size="xs" className="font-bold text-typography-500 ml-1">LANDMARK NAME</Text>
                            <Controller
                                control={control}
                                name="name"
                                render={({ field: { onChange, value, onBlur } }) => (
                                    <Input isInvalid={!!errors.name} size="lg" className="rounded-xl">
                                        <InputSlot className="pl-3"><InputIcon as={Type} /></InputSlot>
                                        <InputField placeholder="e.g. Barasoain Church" value={value} onChangeText={onChange} onBlur={onBlur} />
                                    </Input>
                                )}
                            />
                            {errors.name && <Text className="text-error-600 text-xs ml-1">{errors.name.message}</Text>}
                        </VStack>

                        {/* Description Textarea */}
                        <VStack className="gap-2">
                            <Text size="xs" className="font-bold text-typography-500 ml-1">HISTORY & DESCRIPTION</Text>
                            <Controller
                                control={control}
                                name="description"
                                render={({ field: { onChange, value } }) => (
                                    <Textarea isInvalid={!!errors.description} className="rounded-xl">
                                        <TextareaInput
                                            placeholder="Enter historical significance..."
                                            value={value}
                                            onChangeText={onChange}
                                            multiline
                                        />
                                    </Textarea>
                                )}
                            />
                        </VStack>
                    </VStack>

                    {/* 3. Location Section */}
                    <VStack className="gap-4 mb-10">
                        <HStack className="items-center gap-2">
                            <Icon as={Navigation2} size="sm" className="text-primary-600" />
                            <Heading size="md">Coordinates</Heading>
                        </HStack>

                        <HStack space="md">
                            <VStack className="flex-1 gap-2">
                                <Controller
                                    control={control}
                                    name="latitude"
                                    render={({ field: { onChange, value } }) => (
                                        <Input size="md" className="rounded-xl">
                                            <InputField placeholder="Latitude" value={value} onChangeText={onChange} keyboardType="numeric" />
                                        </Input>
                                    )}
                                />
                            </VStack>
                            <VStack className="flex-1 gap-2">
                                <Controller
                                    control={control}
                                    name="longitude"
                                    render={({ field: { onChange, value } }) => (
                                        <Input size="md" className="rounded-xl">
                                            <InputField placeholder="Longitude" value={value} onChangeText={onChange} keyboardType="numeric" />
                                        </Input>
                                    )}
                                />
                            </VStack>
                        </HStack>
                    </VStack>
                </VStack>
            </ScrollView>

            {/* Fixed Save Button */}
            <Box className="p-6 bg-background-0 border-t border-outline-50">
                <Button
                    onPress={handleSubmit(onSave)}
                    size="lg"
                    isDisabled={!isDirty}
                    className={`rounded-2xl h-14 ${isDirty ? 'bg-primary-600' : 'bg-background-200'}`}
                >
                    <ButtonIcon as={Save} className="mr-2" />
                    <ButtonText className="font-bold">Save Changes</ButtonText>
                </Button>
            </Box>
        </KeyboardAvoidingView>
    );
}