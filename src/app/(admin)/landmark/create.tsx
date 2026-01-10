import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, useRouter } from 'expo-router';
import {
    ArrowLeft,
    CheckCircle2,
    Image as ImageIcon,
    MapPin,
    Navigation2,
    Plus,
    Type
} from 'lucide-react-native';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import * as z from 'zod';

import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { Textarea, TextareaInput } from '@/components/ui/textarea';
import { Toast, ToastTitle, useToast } from '@/components/ui/toast';
import { VStack } from '@/components/ui/vstack';

// --- Validation Schema ---
const createLandmarkSchema = z.object({
    name: z.string().min(3, "Landmark name is required"),
    description: z.string().min(10, "Please provide a detailed history"),
    latitude: z.string().refine(val => !isNaN(parseFloat(val)), "Latitude must be a number"),
    longitude: z.string().refine(val => !isNaN(parseFloat(val)), "Longitude must be a number"),
    imageUrl: z.string().url("Valid URL required").min(1, "Image is required"),
});

type CreateFormData = z.infer<typeof createLandmarkSchema>;

export default function AdminLandmarkCreateScreen() {
    const router = useRouter();
    const toast = useToast();

    const { control, handleSubmit, formState: { errors, isValid } } = useForm<CreateFormData>({
        resolver: zodResolver(createLandmarkSchema),
        mode: "onChange",
        defaultValues: {
            name: '',
            description: '',
            latitude: '',
            longitude: '',
            imageUrl: '',
        }
    });

    const onCreate = (data: CreateFormData) => {
        // Here you would call your Supabase/API mutation
        console.log("Creating New Landmark: ", data);

        toast.show({
            placement: "top",
            render: ({ id }) => (
                <Toast nativeID={id} action="success" variant="solid" className="gap-3">
                    <Icon as={CheckCircle2} color="white" />
                    <ToastTitle>Landmark Created Successfully</ToastTitle>
                </Toast>
            ),
        });

        router.back();
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="bg-background-0"
            style={{ flex: 1 }}
        >
            <Stack.Screen options={{
                headerTitle: "New Landmark",
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()} className="mr-4">
                        <ArrowLeft color="black" size={24} />
                    </TouchableOpacity>
                )
            }} />

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <VStack className="p-6 gap-8">

                    {/* 1. Image Upload Placeholder */}
                    <VStack className="gap-4">
                        <Heading size="md">Landmark Photo</Heading>
                        <Controller
                            control={control}
                            name="imageUrl"
                            render={({ field: { onChange, value } }) => (
                                <VStack gap-3>
                                    <TouchableOpacity
                                        className="w-full h-48 rounded-3xl border-2 border-dashed border-outline-200 bg-background-50 items-center justify-center overflow-hidden"
                                        onPress={() => {/* Handle Image Picker */ }}
                                    >
                                        {value ? (
                                            <View className="w-full h-full">
                                                <View className="absolute inset-0 bg-black/20 z-10 items-center justify-center">
                                                    <Text className="text-white font-bold">Change Image</Text>
                                                </View>
                                                <View className="w-full h-full">
                                                    {/* Image component would go here */}
                                                </View>
                                            </View>
                                        ) : (
                                            <VStack className="items-center gap-2">
                                                <Box className="bg-primary-50 p-4 rounded-full">
                                                    <Icon as={ImageIcon} size="xl" className="text-primary-600" />
                                                </Box>
                                                <Text size="sm" className="text-typography-400 font-medium">Upload via URL or Gallery</Text>
                                            </VStack>
                                        )}
                                    </TouchableOpacity>
                                    <Input variant="outline" size="md" className="rounded-xl">
                                        <InputField placeholder="Paste Image URL" value={value} onChangeText={onChange} />
                                    </Input>
                                    {errors.imageUrl && <Text className="text-error-600 text-xs ml-1">{errors.imageUrl.message}</Text>}
                                </VStack>
                            )}
                        />
                    </VStack>

                    {/* 2. Form Fields */}
                    <VStack className="gap-5">
                        <VStack className="gap-2">
                            <Text size="xs" className="font-bold text-typography-500 ml-1">OFFICIAL NAME</Text>
                            <Controller
                                control={control}
                                name="name"
                                render={({ field: { onChange, value } }) => (
                                    <Input size="lg" className="rounded-xl" isInvalid={!!errors.name}>
                                        <InputSlot className="pl-3"><InputIcon as={Type} /></InputSlot>
                                        <InputField placeholder="e.g. Malolos Cathedral" value={value} onChangeText={onChange} />
                                    </Input>
                                )}
                            />
                        </VStack>

                        <VStack className="gap-2">
                            <Text size="xs" className="font-bold text-typography-500 ml-1">HISTORICAL DATA</Text>
                            <Controller
                                control={control}
                                name="description"
                                render={({ field: { onChange, value } }) => (
                                    <Textarea className="rounded-xl" isInvalid={!!errors.description}>
                                        <TextareaInput
                                            placeholder="Write the history of this place..."
                                            value={value}
                                            onChangeText={onChange}
                                            className="h-32"
                                        />
                                    </Textarea>
                                )}
                            />
                        </VStack>

                        <HStack space="md">
                            <VStack className="flex-1 gap-2">
                                <Text size="xs" className="font-bold text-typography-500 ml-1">LATITUDE</Text>
                                <Controller
                                    control={control}
                                    name="latitude"
                                    render={({ field: { onChange, value } }) => (
                                        <Input size="md" className="rounded-xl" isInvalid={!!errors.latitude}>
                                            <InputSlot className="pl-3"><InputIcon as={Navigation2} /></InputSlot>
                                            <InputField placeholder="14.8..." value={value} onChangeText={onChange} keyboardType="numeric" />
                                        </Input>
                                    )}
                                />
                            </VStack>
                            <VStack className="flex-1 gap-2">
                                <Text size="xs" className="font-bold text-typography-500 ml-1">LONGITUDE</Text>
                                <Controller
                                    control={control}
                                    name="longitude"
                                    render={({ field: { onChange, value } }) => (
                                        <Input size="md" className="rounded-xl" isInvalid={!!errors.longitude}>
                                            <InputSlot className="pl-3"><InputIcon as={MapPin} /></InputSlot>
                                            <InputField placeholder="120.8..." value={value} onChangeText={onChange} keyboardType="numeric" />
                                        </Input>
                                    )}
                                />
                            </VStack>
                        </HStack>
                    </VStack>
                </VStack>
            </ScrollView>

            {/* Bottom Action */}
            <Box className="p-6 bg-background-0 border-t border-outline-50">
                <Button
                    onPress={handleSubmit(onCreate)}
                    size="lg"
                    // Use a standard boolean check
                    isDisabled={!isValid}
                >
                    <ButtonIcon as={Plus} className="mr-2" />
                    <ButtonText className="font-bold">Publish Landmark</ButtonText>
                </Button>
            </Box>
        </KeyboardAvoidingView>
    );
}