import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { AlertCircle, Trash, Type, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import z from 'zod';

import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { Center } from '@/components/ui/center';
import { FormControl, FormControlError, FormControlErrorIcon, FormControlErrorText, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Modal, ModalBackdrop, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@/components/ui/modal';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

import { useToastNotification } from '@/src/hooks/useToastNotification';
import { useAuthStore } from '@/src/stores/useAuth';
import { supabase } from '@/src/utils/supabase';

const profileSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters").max(50),
});

type ProfileForm = z.infer<typeof profileSchema>;

const AccountSettingsScreen = () => {
    const { session } = useAuthStore();
    const userId = session?.user.id;
    const userEmail = session?.user.email;
    const queryClient = useQueryClient();
    const router = useRouter();

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const { showToast } = useToastNotification()


    // 1. Fetch Profile Data
    const { data: userProfile, isLoading } = useQuery({
        queryKey: ['profile', userId],
        enabled: !!userId,
        queryFn: async () => {
            const { error, data } = await supabase.from("profiles").select("*").eq("user_id", userId!).single();
            if (error) throw error;
            return data;
        }
    });


    const { control, handleSubmit, reset, formState: { errors, isValid, isDirty } } = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
        defaultValues: { name: '' },
        mode: 'onChange',
    });

    // 2. Sync Form with Fetched Data
    useEffect(() => {
        if (userProfile?.full_name) {
            reset({ name: userProfile.full_name });
        }
    }, [userProfile, reset]);


    const onUpdateName = async (form: ProfileForm) => {
        setIsUpdating(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: form.name })
                .eq('user_id', userId!);

            if (error) throw error;

            await queryClient.invalidateQueries({ queryKey: ['profile', userId] });
            reset({ name: form.name });
            showToast({
                title: "Itinerary updated!",
            })
        } catch (e: any) {
            showToast({
                title: "Something went wrong.",
                description: "Please try again." + e.message,
                action: "error",
            })
        } finally {
            setIsUpdating(false);
        }
    };

    const confirmDeleteAccount = async () => {
        try {
            const { data, error } = await supabase.functions.invoke('delete-account');

            if (error) {
                // Supabase function errors are often wrapped in a context object
                const errBody = await error.context?.json();
                throw new Error(errBody?.error || error.message);
            }

            console.log('Account deleted successfully');
            showToast({
                title: "Account deleted!"
            })

            await supabase.auth.signOut();
            router.replace("/signin");

        } catch (e: any) {
            console.error("Delete Error:", e);
            showToast({
                title: "Something went wrong.",
                description: "Please try again." + e.message,
                action: "error",
            })
        }
    }

    if (isLoading) {
        return (
            <Center className='flex-1 bg-background-0'>
                <ActivityIndicator size="large" color="#4f46e5" />
            </Center>
        );
    }

    return (
        <>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView
                    className='bg-background-0'
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <VStack className='p-6 gap-8 flex-1'>

                        {/* Profile Header Info */}
                        <HStack className="items-center gap-4 bg-background-50 p-4 rounded-3xl">
                            <Box className="bg-primary-100 p-3 rounded-2xl">
                                <User size={24} color="#4f46e5" />
                            </Box>
                            <VStack>
                                <Text size="xs" className="text-typography-500">Logged in as</Text>
                                <Text size="sm" className="font-bold text-typography-900">{userEmail}</Text>
                            </VStack>
                        </HStack>

                        {/* General Settings */}
                        <VStack className='gap-4'>
                            <Heading size="xs" className="text-typography-400 uppercase tracking-widest ml-1">General Settings</Heading>
                            <FormControl isInvalid={!!errors.name} >
                                <FormControlLabel>
                                    <FormControlLabelText>Display Name</FormControlLabelText>
                                </FormControlLabel>
                                <Controller
                                    control={control}
                                    name="name"
                                    render={({ field: { onChange, value } }) => (
                                        <Input size="xl" className="rounded-2xl bg-background-0 border-outline-200">
                                            <InputSlot className="pl-4">
                                                <InputIcon as={Type} className="text-typography-400" />
                                            </InputSlot>
                                            <InputField
                                                value={value}
                                                onChangeText={onChange}
                                                placeholder="Enter your name"
                                                returnKeyType="done"
                                            />
                                        </Input>
                                    )}
                                />
                                <FormControlError>
                                    <FormControlErrorIcon as={AlertCircle} />
                                    <FormControlErrorText>{errors.name?.message}</FormControlErrorText>
                                </FormControlError>
                            </FormControl>

                            <Button
                                size="lg"
                                className="rounded-2xl"
                                onPress={handleSubmit(onUpdateName)}
                                isDisabled={!isDirty || !isValid || isUpdating}
                            >
                                {isUpdating ? <ButtonSpinner className="mr-2" /> : null}
                                <ButtonText>Update Profile</ButtonText>
                            </Button>
                        </VStack>

                        {/* Danger Zone */}
                        <VStack className="mt-auto pb-8 gap-4">
                            <Box className="bg-error-50 p-5 rounded-3xl border border-error-100">
                                <HStack className="items-center gap-2 mb-2">
                                    <AlertCircle size={18} color="#dc2626" />
                                    <Heading size="xs" className="text-error-700">Danger Zone</Heading>
                                </HStack>
                                <Text size="xs" className="text-error-600 mb-4 leading-5">
                                    Deleting your account is permanent. All your data, saved itineraries, and progress will be removed immediately.
                                </Text>
                                <Button
                                    action='negative'
                                    variant="outline"
                                    className="rounded-2xl border-error-200 bg-white"
                                    onPress={() => setIsDeleteModalOpen(true)}
                                >
                                    <ButtonIcon as={Trash} className="mr-2" />
                                    <ButtonText className="text-error-700">Delete Account</ButtonText>
                                </Button>
                            </Box>
                        </VStack>
                    </VStack>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} size="md">
                <ModalBackdrop />
                <ModalContent className="rounded-3xl p-4">
                    <ModalHeader>
                        <Heading size="lg" className="text-typography-950">Are you absolutely sure?</Heading>
                    </ModalHeader>
                    <ModalBody>
                        <Text className="text-typography-500 leading-6">
                            This action <Text className="font-bold text-error-600">cannot be undone</Text>. This will permanently delete your account and remove your data from our servers.
                        </Text>
                    </ModalBody>
                    <ModalFooter className="gap-3 mt-4">
                        <Button variant="outline" action="secondary" className="flex-1 rounded-2xl" onPress={() => setIsDeleteModalOpen(false)}>
                            <ButtonText>Cancel</ButtonText>
                        </Button>
                        <Button action="negative" className="flex-1 rounded-2xl" onPress={confirmDeleteAccount}>
                            <ButtonText>Yes, Delete</ButtonText>
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

export default AccountSettingsScreen;