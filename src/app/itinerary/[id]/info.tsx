import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { AlertCircle, Trash, Type } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { z } from 'zod';

// UI Components
import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { FormControl, FormControlError, FormControlErrorIcon, FormControlErrorText, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';
import { Heading } from '@/components/ui/heading';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Modal, ModalBackdrop, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@/components/ui/modal';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

// Helpers
import { Center } from '@/components/ui/center';
import { useToastNotification } from '@/src/hooks/useToastNotification';
import { useAuthStore } from '@/src/stores/useAuth';
import { fetchItineraryById } from '@/src/utils/fetchItineraries';
import { supabase } from '@/src/utils/supabase';

const itinerarySchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters").max(50),
});

type ItineraryForm = z.infer<typeof itinerarySchema>;

const ItineraryInfoScreen = () => {
    const { id } = useLocalSearchParams();
    const { session } = useAuthStore();
    const userId = session?.user.id;
    const queryClient = useQueryClient();
    const router = useRouter();

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const { showToast } = useToastNotification()

    const { data: itinerary, isLoading } = useQuery({
        queryKey: ['itinerary', id],
        enabled: !!userId && !!id,
        queryFn: () => fetchItineraryById(userId!, Number.parseInt(id.toString()))
    });

    const { control, handleSubmit, reset, formState: { errors, isValid, isDirty } } = useForm<ItineraryForm>({
        resolver: zodResolver(itinerarySchema),
        defaultValues: { name: '' },
        mode: 'onChange',
    });

    // Sync form when data is loaded
    useEffect(() => {
        if (itinerary) {
            reset({ name: itinerary.name });
        }
    }, [itinerary, reset]);

    if (isLoading) {
        return (
            <Box className='flex-1 justify-center items-center bg-background-0'>
                <ActivityIndicator size="large" color="#4f46e5" />
            </Box>
        );
    }

    if (!itinerary)
        return (
            <Center className='flex-1'>
                <Text>Itienrary not found!</Text>
            </Center>
        )


    const onUpdateName = async (form: ItineraryForm) => {
        setIsUpdating(true);
        try {
            const { error } = await supabase
                .from('itinerary')
                .update({ name: form.name })
                .eq('id', itinerary!.id);

            if (error) throw error;

            await queryClient.invalidateQueries({ queryKey: ['itineraries'] });
            await queryClient.invalidateQueries({ queryKey: ['itinerary', id] });

            reset({ name: form.name }); // Mark as pristine again
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

    const confirmDelete = async () => {
        setIsDeleteModalOpen(false);
        setIsUpdating(true);
        try {
            const { error } = await supabase
                .from('itinerary')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', itinerary.id);

            if (error) throw error;

            showToast({
                title: "Itinerary moved to trash",
                description: "You can restore it from Archived Itineraries.",
            })
            await queryClient.invalidateQueries({ queryKey: ['itineraries'] });
            router.dismissTo('/(tabs)/itineraries')
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

    return (
        <>
            <Stack.Screen options={{ title: "Edit Trip", headerShadowVisible: false }} />
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView
                    className='bg-background-0'
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <VStack className='p-6 gap-8 flex-1'>
                        {/* Edit Section */}
                        <VStack className='gap-4'>
                            <Heading size="sm" className="text-typography-500 uppercase tracking-widest">General Settings</Heading>
                            <FormControl isInvalid={!!errors.name} >
                                <FormControlLabel>
                                    <FormControlLabelText>Trip Name</FormControlLabelText>
                                </FormControlLabel>
                                <Controller
                                    control={control}
                                    name="name"
                                    render={({ field: { onChange, value } }) => (
                                        <Input size="xl" className="rounded-2xl bg-background-50 border-outline-100">
                                            <InputSlot className="pl-4">
                                                <InputIcon as={Type} className="text-typography-400" />
                                            </InputSlot>
                                            <InputField
                                                value={value}
                                                onChangeText={onChange}
                                                placeholder="e.g. My Weekend Walk"
                                                returnKeyType="done"
                                                onSubmitEditing={handleSubmit(onUpdateName)}
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
                                {isUpdating && <ButtonSpinner className="mr-2" />}
                                <ButtonText>Save Changes</ButtonText>
                            </Button>
                        </VStack>

                        <Divider className="my-4" />

                        {/* Danger Zone */}
                        <VStack className="mt-auto pb-8 gap-4">
                            <Box className="bg-error-50 p-4 rounded-2xl border border-error-100">
                                <Heading size="xs" className="text-error-700 mb-1">Danger Zone</Heading>
                                <Text size="xs" className="text-error-600 mb-4">
                                    Moving this itinerary to trash will hide it from your list. It can be restored from the &quot;Archived Itineraries&quot; section.
                                </Text>
                                <Button
                                    action='negative'
                                    className="rounded-xl border-error-200"
                                    onPress={() => setIsDeleteModalOpen(true)}
                                >
                                    <ButtonIcon as={Trash} className="mr-2" />
                                    <ButtonText >Delete Itinerary</ButtonText>
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
                        <Heading size="lg" className="text-typography-950">Confirm Delete</Heading>
                    </ModalHeader>
                    <ModalBody>
                        <Text className="text-typography-500">
                            Are you sure you want to move <Text className="font-bold text-typography-900">&quot;{itinerary?.name}&quot;</Text> to trash? You can restore it later.
                        </Text>
                    </ModalBody>
                    <ModalFooter className="gap-3">
                        <Button variant="outline" action="secondary" className="flex-1 rounded-xl" onPress={() => setIsDeleteModalOpen(false)}>
                            <ButtonText>Cancel</ButtonText>
                        </Button>
                        <Button action="negative" className="flex-1 rounded-xl" onPress={confirmDelete}>
                            <ButtonText>Delete</ButtonText>
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

export default ItineraryInfoScreen;