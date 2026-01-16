import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { FormControl, FormControlError, FormControlErrorIcon, FormControlErrorText, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Modal, ModalBackdrop, ModalContent } from '@/components/ui/modal';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAuthStore } from '@/src/stores/useAuth';
import { fetchItineraryById } from '@/src/utils/fetchItineraries';
import { supabase } from '@/src/utils/supabase';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertCircle, Trash, Type } from 'lucide-react-native';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, KeyboardAvoidingView, ScrollView, ToastAndroid } from 'react-native';
import z from 'zod';


const itinerarySchema = z.object({
    name: z.string(),
})

const ItineraryInfoScreen = () => {
    const { id } = useLocalSearchParams();
    const { session } = useAuthStore();
    const userId = session?.user.id;
    const { data: itinerary, isLoading, refetch } = useQuery({
        queryKey: ['itinerary', id],
        enabled: !!userId && !!id,
        queryFn: async () => fetchItineraryById(userId!, Number.parseInt(id.toString()))
    });

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const queryClient = useQueryClient()
    const router = useRouter();


    const {
        formState: {
            errors,
            isValid,
            isDirty,
        },
        control,
        handleSubmit,
        reset,
    } = useForm<z.infer<typeof itinerarySchema>>({
        resolver: zodResolver(itinerarySchema),
        defaultValues: {
            name: itinerary?.name ?? ''
        },
        mode: 'onChange',
    })


    if (isLoading || !itinerary) {
        return (
            <Box className='flex-1 justify-center items-center bg-background-0'>
                <ActivityIndicator size="large" color="#007AFF" />
            </Box>
        );
    }

    const confirmDelete = async () => {
        setIsDeleteModalOpen(false);
        setIsUpdating(true);
        try {
            const { error } = await supabase.from('itinerary').delete().eq('id', itinerary.id);
            if (error) throw error;

            ToastAndroid.show('Itinerary deleted successfully', ToastAndroid.SHORT);

            await queryClient.invalidateQueries({ queryKey: ['itineraries'] });
            router.back();
        } catch (e) {
            ToastAndroid.show('Failed to delete itinerary', ToastAndroid.SHORT);
        } finally {
            setIsUpdating(false);
        }
    };

    const updateName = async (form: z.infer<typeof itinerarySchema>) => {
        setIsUpdating(true);
        console.log("UIPDATING")
        try {
            const { error, data } = await supabase.from('itinerary')
                .update({ name: form.name })
                .eq('id', itinerary.id);
            if (error) throw error;
            console.log(form.name)
            const { data: newData } = await refetch();
            await queryClient.invalidateQueries({ queryKey: ['itineraries'] });
            reset(newData)
            ToastAndroid.show('Itinerary updated successfully', ToastAndroid.SHORT);
        } catch (e) {
            ToastAndroid.show('Failed to update itinerary', ToastAndroid.SHORT);
        } finally {
            setIsUpdating(false);
        }
    }


    return (
        <>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                className='bg-background-50'
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="always"
                >
                    <VStack
                        className='px-3 py-8 flex-1'
                    >
                        <VStack className='flex-1'>
                            <VStack space='sm'>
                                <FormControl isInvalid={!!errors.name}>
                                    <FormControlLabel className="mb-1">
                                        <FormControlLabelText size="xs" className="uppercase font-bold">Official Name</FormControlLabelText>
                                    </FormControlLabel>
                                    <Controller control={control} name="name" render={({ field: { onChange, value } }) => (
                                        <Input size="lg" className="rounded-xl"><InputSlot className="pl-3"><InputIcon as={Type} /></InputSlot>
                                            <InputField value={value} onChangeText={onChange} /></Input>
                                    )} />
                                    <FormControlError><FormControlErrorIcon as={AlertCircle} /><FormControlErrorText>{errors.name?.message}</FormControlErrorText></FormControlError>
                                </FormControl>
                                <Button
                                    onPress={handleSubmit(updateName)}
                                    isDisabled={!isDirty || !isValid}
                                >
                                    <ButtonText>Update</ButtonText>
                                </Button>
                            </VStack>
                        </VStack>
                        <Button
                            onPress={() => setIsDeleteModalOpen(true)}
                            action='negative'
                        >
                            <ButtonText>Delete</ButtonText>
                        </Button>
                    </VStack>
                </ScrollView>
            </KeyboardAvoidingView>
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
                <ModalBackdrop />
                <ModalContent>
                    <VStack space="lg" >
                        <VStack space="xs">
                            <Heading size="md">Delete Itinerary?</Heading>
                            <Text size="sm" className="text-typography-500">
                                This action cannot be undone. All stops and progress will be lost.
                            </Text>
                        </VStack>
                        <HStack space="md" className="justify-end">
                            <Button variant="outline" action="secondary" onPress={() => setIsDeleteModalOpen(false)}>
                                <ButtonText>Cancel</ButtonText>
                            </Button>
                            <Button action="negative" onPress={confirmDelete}>
                                <ButtonIcon as={Trash} className="mr-2" />
                                <ButtonText>Delete</ButtonText>
                            </Button>
                        </HStack>
                    </VStack>
                </ModalContent>
            </Modal>
        </>
    )
}

export default ItineraryInfoScreen