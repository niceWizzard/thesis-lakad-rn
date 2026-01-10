import { supabase } from '@/src/utils/supabase';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { ArrowRight, CheckCircle2, UserCircle2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Keyboard, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, View } from 'react-native';
import * as z from 'zod';

import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { Toast, ToastTitle, useToast } from '@/components/ui/toast';
import { VStack } from '@/components/ui/vstack';
import { useAuthStore } from '@/src/stores/useAuth';

const profileSchema = z.object({
    fullName: z.string()
        .min(3, "Full name must be at least 3 characters")
        .max(50, "Full name is too long")
        .regex(/^[a-zA-Z\s]*$/, "Only letters and spaces are allowed"),
});

type ProfileSchema = z.infer<typeof profileSchema>;

export default function SetupProfileScreen() {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const auth = useAuthStore();
    const user = auth.session?.user;

    const { control, handleSubmit, formState: { errors, isValid } } = useForm<ProfileSchema>({
        resolver: zodResolver(profileSchema),
        defaultValues: { fullName: '' },
        mode: "onChange"
    });

    const onCompleteSetup = async (data: ProfileSchema) => {
        if (!user) return;
        setLoading(true);

        try {
            // Upsert: Create if not exists, update if it does.
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    user_id: user.id,
                    email: user.email!,
                    full_name: data.fullName,
                });

            if (error) throw error;

            toast.show({
                placement: "top",
                render: ({ id }) => (
                    <Toast nativeID={id} action="success" variant="solid" className='flex-row gap-2'>
                        <CheckCircle2 size={18} color="white" className="mr-2" />
                        <ToastTitle>Profile Set Up!</ToastTitle>
                    </Toast>
                ),
            });

            // Redirect to the main app flow
            router.replace('/(tabs)');
        } catch (error: any) {
            console.error(error);
            toast.show({
                placement: "top",
                render: ({ id }) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <ToastTitle>Error saving profile</ToastTitle>
                    </Toast>
                ),
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-background-0"
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View className="flex-1 justify-center px-8">
                    <VStack className="items-center mb-10 gap-4">
                        <Box className="bg-primary-50 p-6 rounded-full">
                            <UserCircle2 size={64} color="#4f46e5" strokeWidth={1.5} />
                        </Box>
                        <VStack className="items-center gap-2">
                            <Heading size="2xl" className="text-center">Welcome to Lakad</Heading>
                            <Text size="md" className="text-typography-500 text-center">
                                Let's start by getting your name so we can personalize your experience.
                            </Text>
                        </VStack>
                    </VStack>

                    <Box className="bg-background-50 p-6 rounded-[32px] border border-outline-100 shadow-soft-1">
                        <VStack className="gap-6">
                            <VStack className="gap-2">
                                <Text size="sm" className="font-bold text-typography-700 ml-1">
                                    WHAT SHOULD WE CALL YOU?
                                </Text>
                                <Controller
                                    control={control}
                                    name="fullName"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <Input variant="outline" size="xl" className="h-16 rounded-2xl" isInvalid={!!errors.fullName}>
                                            <InputSlot className="pl-4">
                                                <InputIcon as={UserCircle2} />
                                            </InputSlot>
                                            <InputField
                                                placeholder="Juan Dela Cruz"
                                                onBlur={onBlur}
                                                onChangeText={onChange}
                                                value={value}
                                                autoFocus
                                                onSubmitEditing={handleSubmit(onCompleteSetup)}
                                            />
                                        </Input>
                                    )}
                                />
                                {errors.fullName && (
                                    <Text size="xs" className="text-error-600 ml-1">
                                        {errors.fullName.message}
                                    </Text>
                                )}
                            </VStack>

                            <Button
                                size="lg"
                                className="rounded-2xl h-16 bg-primary-600"
                                onPress={handleSubmit(onCompleteSetup)}
                                isDisabled={!isValid || loading}
                            >
                                {loading ? (
                                    <Text className="text-white">Saving...</Text>
                                ) : (
                                    <>
                                        <ButtonText className="font-bold">Finish Setup</ButtonText>
                                        <ButtonIcon as={ArrowRight} className="ml-2" />
                                    </>
                                )}
                            </Button>
                        </VStack>
                    </Box>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}