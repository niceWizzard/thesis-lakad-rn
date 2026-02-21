import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Camera, Star, Trash2, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Image, Platform, Pressable, ScrollView } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { AlertDialog, AlertDialogBackdrop, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader } from '@/components/ui/alert-dialog';
import { Box } from '@/components/ui/box';
import { Button, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { FormControl, FormControlError, FormControlErrorText, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Textarea, TextareaInput } from '@/components/ui/textarea';
import { VStack } from '@/components/ui/vstack';
import { useToastNotification } from '@/src/hooks/useToastNotification';
import { useAuthStore } from '@/src/stores/useAuth';
import { fetchReviewById } from '@/src/utils/review/fetchReview';
import { supabase } from '@/src/utils/supabase';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const reviewFormSchema = z.object({
    rating: z.number().min(1, "Please select a rating."),
    reviewText: z.string().optional(),
    images: z.array(z.string()).max(3, "You can upload up to 3 images."),
});

type ReviewFormData = z.infer<typeof reviewFormSchema>;

export default function ReviewScreen() {
    const { id } = useLocalSearchParams();
    const { showToast } = useToastNotification();
    const { session } = useAuthStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: existingReview, isLoading: isLoadingReview, error: reviewError } = useQuery({
        queryKey: ['landmark_review', id],
        queryFn: async () => {
            if (!session?.user?.id) return null;

            const review = await fetchReviewById(id.toString(), session.user.id);
            return review;
        },
        enabled: !!session?.user?.id && !!id,
    });


    const {
        control,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isValid },
    } = useForm<ReviewFormData>({
        resolver: zodResolver(reviewFormSchema),
        values: existingReview ? {
            rating: existingReview.rating || 1,
            reviewText: existingReview.content || '',
            images: existingReview.images,
        } : {
            rating: 1,
            reviewText: '',
            images: [],
        },
    });

    const selectedImages = watch('images') || [];

    const handlePickImages = async () => {
        const remainingSpots = 3 - selectedImages.length;
        if (remainingSpots <= 0) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            selectionLimit: remainingSpots,
            quality: 0.7,
        });

        if (!result.canceled) {
            const newUris = result.assets.map(a => a.uri);
            const combined = [...selectedImages, ...newUris].slice(0, 3);
            setValue('images', combined, { shouldValidate: true, shouldDirty: true });
        }
    };

    const handleRemoveImage = (indexToRemove: number) => {
        const newImages = selectedImages.filter((_, idx) => idx !== indexToRemove);
        setValue('images', newImages, { shouldValidate: true, shouldDirty: true });
    };

    const handleDeleteReview = async () => {
        if (!existingReview?.id) return;
        setIsDeleting(true);

        try {
            // Remove images associated with the review
            const imagesToRemove = (existingReview.images || []).map((url: string) => {
                if (url.includes('supabase.co')) {
                    const pathWithQuery = url.split('/object/public/images/')[1];
                    if (!pathWithQuery) return null;
                    return pathWithQuery.split('?')[0];
                }
                return url;
            }).filter(Boolean) as string[];

            if (imagesToRemove.length > 0) {
                const { error: removeError } = await supabase.storage.from('images').remove(imagesToRemove);
                if (removeError) {
                    console.error('Failed to clean up review images', removeError);
                }
            }

            const { error: deleteError } = await supabase
                .from('landmark_reviews')
                .delete()
                .eq('id', existingReview.id);

            if (deleteError) throw deleteError;

            await queryClient.invalidateQueries({ queryKey: ['landmark', id] });
            await queryClient.invalidateQueries({ queryKey: ['landmarks'] });
            await queryClient.invalidateQueries({ queryKey: ['landmark_review', id] });

            showToast({
                title: "Success",
                description: "Review deleted successfully.",
                action: "success",
            });

            router.back();
        } catch (error) {
            console.error('Error deleting review:', error);
            showToast({
                title: "Error",
                description: "Failed to delete review. Please try again.",
                action: "error",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const confirmDelete = () => {
        setIsAlertDialogOpen(true);
    };

    const onSubmit = async (data: ReviewFormData) => {
        setIsSubmitting(true);

        try {
            // upload images to supabase storage
            const uploadedImages = await Promise.all(
                data.images.map(async (uri) => {
                    if (uri.includes('supabase.co')) {
                        const pathWithQuery = uri.split('/object/public/images/')[1];
                        if (!pathWithQuery) return uri;
                        return pathWithQuery.split('?')[0];
                    }

                    const fileName = `review-${Date.now()}-${uri.split('/').pop()}`;
                    const formData = new FormData();
                    formData.append('file', {
                        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
                        name: fileName,
                        type: 'image/jpeg',
                    } as any);

                    const { data: uploadedData, error } = await supabase.storage
                        .from('images')
                        .upload(`reviews/${fileName}`, formData);
                    if (error) throw error;

                    return uploadedData.path;
                })
            )

            if (existingReview?.id) {
                // Determine images that were removed by the user
                const removedImagesPaths = (existingReview.images || [])
                    .map((url: string) => {
                        if (url.includes('supabase.co')) {
                            const pathWithQuery = url.split('/object/public/images/')[1];
                            if (!pathWithQuery) return null;
                            return pathWithQuery.split('?')[0];
                        }
                        return url;
                    })
                    .filter((path: string | null) => path && !uploadedImages.includes(path)) as string[];


                if (removedImagesPaths.length > 0) {
                    const { error: removeError } = await supabase.storage.from('images').remove(removedImagesPaths);
                    if (removeError) {
                        console.error('Failed to clean up old images', removeError);
                    }
                }

                const { error: reviewError } = await supabase
                    .from('landmark_reviews')
                    .update({
                        content: data.reviewText ?? '',
                        images: uploadedImages,
                        rating: data.rating,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', existingReview.id);

                if (reviewError) throw reviewError;
            } else {
                const { error: reviewError } = await supabase
                    .rpc('submit_landmark_review', {
                        content_input: data.reviewText ?? '',
                        images_input: uploadedImages,
                        landmark_id_input: Number(id),
                        rating_input: data.rating,
                    })

                if (reviewError) throw reviewError;
            }
            await queryClient.invalidateQueries({ queryKey: ['landmark_review', id] });
            await queryClient.invalidateQueries({ queryKey: ['landmark', id] });
            await queryClient.invalidateQueries({ queryKey: ['landmarks'] });
            setIsSubmitting(false);

            router.back();
        } catch (error) {
            console.error('Error submitting review:', error);
            showToast({
                title: "Error",
                description: "Failed to submit review. Please try again.",
                action: "error",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingReview) {
        return (
            <Box className="flex-1 bg-background-50 justify-center items-center">
                <Stack.Screen options={{ title: 'Write a Review' }} />
                <ActivityIndicator size="large" color="#0891b2" />
            </Box>
        );
    }

    if (reviewError) {
        return (
            <Box className="flex-1 bg-background-50 justify-center items-center">
                <Stack.Screen options={{ title: 'Write a Review' }} />
                <Text className="text-center text-red-500">Failed to load review. Please try again.</Text>
            </Box>
        );
    }

    return (
        <Box className="flex-1 bg-background-50">
            <Stack.Screen
                options={{
                    title: existingReview ? 'Edit Review' : 'Write a Review',
                    headerRight: () => existingReview ? (
                        <Pressable onPress={confirmDelete} className="p-2 -mr-2 active:opacity-50" disabled={isSubmitting || isDeleting}>
                            {isDeleting ? <ActivityIndicator size="small" color="#ef4444" /> : <Icon as={Trash2} size="md" className="text-error-500" />}
                        </Pressable>
                    ) : undefined,
                }}
            />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}>
                    <VStack space="xl" className="p-6">
                        <FormControl isInvalid={!!errors.rating}>
                            <Box className="p-6 rounded-xl border border-outline-100 items-center">
                                <Heading size="lg" className="mb-2 text-typography-900">How was your visit?</Heading>
                                <Text size="sm" className="text-typography-500 text-center mb-6">
                                    Tap the stars to rate your experience at this landmark.
                                </Text>

                                <Controller
                                    control={control}
                                    name="rating"
                                    rules={{ required: "Please select a rating." }}
                                    render={({ field: { onChange, value } }) => (
                                        <HStack space="md">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Pressable key={star} onPress={() => onChange(star)} className="p-1">
                                                    <Star
                                                        size={44}
                                                        color={star <= value ? "#f59e0b" : "#e5e5e5"}
                                                        fill={star <= value ? "#f59e0b" : "none"}
                                                    />
                                                </Pressable>
                                            ))}
                                        </HStack>
                                    )}
                                />
                                <FormControlError>
                                    <FormControlErrorText>{errors.rating?.message}</FormControlErrorText>
                                </FormControlError>
                            </Box>
                        </FormControl>

                        <FormControl isInvalid={!!errors.reviewText}>
                            <VStack space="md">
                                <FormControlLabel>
                                    <FormControlLabelText className="font-bold text-typography-900 ml-1">Share your thoughts</FormControlLabelText>
                                </FormControlLabel>
                                <Controller
                                    control={control}
                                    name="reviewText"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <Textarea className="h-40 rounded-xl border-outline-200">
                                            <TextareaInput
                                                placeholder="Tell others what you liked or how your experience could have been better..."
                                                placeholderTextColor="#a3a3a3"
                                                value={value}
                                                onChangeText={onChange}
                                                onBlur={onBlur}
                                                textAlignVertical="top"
                                                className="p-5 text-typography-900"
                                            />
                                        </Textarea>
                                    )}
                                />
                            </VStack>
                        </FormControl>

                        <FormControl isInvalid={!!errors.images}>
                            <VStack space="md">
                                <HStack className="justify-between items-center px-1">
                                    <FormControlLabel>
                                        <FormControlLabelText className="font-bold text-typography-900">Add Photos</FormControlLabelText>
                                    </FormControlLabel>
                                    <Text size="sm" className="text-typography-500">{selectedImages.length}/3</Text>
                                </HStack>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-1 py-1">
                                    <HStack space="md">
                                        {selectedImages.map((uri, index) => (
                                            <Box key={index} className="relative size-32 rounded-xl overflow-hidden border border-outline-100">
                                                <Image source={{ uri }} className="w-full h-full" resizeMode="cover" />
                                                <Pressable
                                                    onPress={() => handleRemoveImage(index)}
                                                    className="absolute top-1 right-1 bg-secondary-500 rounded-full p-1"
                                                >
                                                    <Icon as={X} size='sm' />
                                                </Pressable>
                                            </Box>
                                        ))}

                                        {selectedImages.length < 3 && (
                                            <Pressable
                                                onPress={handlePickImages}
                                                className="size-32 rounded-xl border-2 border-dashed border-outline-200 items-center justify-center bg-background-50 active:bg-background-100"
                                            >
                                                <VStack className="items-center" space="xs">
                                                    <Icon as={Camera} size='xl' className="text-typography-400" />
                                                    <Text size="sm" className="text-typography-400 font-medium">Add</Text>
                                                </VStack>
                                            </Pressable>
                                        )}
                                    </HStack>
                                </ScrollView>
                                <FormControlError>
                                    <FormControlErrorText>{errors.images?.message}</FormControlErrorText>
                                </FormControlError>
                            </VStack>
                        </FormControl>
                    </VStack>
                </ScrollView>
                <Divider />
                <Box className="p-6">
                    <Button
                        className="w-full rounded-xl bg-primary-600 h-14"
                        onPress={handleSubmit(onSubmit)}
                        isDisabled={isSubmitting || isDeleting || !isValid}
                    >
                        {
                            isSubmitting && <ButtonSpinner />
                        }
                        <ButtonText className="font-bold text-lg">{existingReview ? 'Update Review' : 'Submit Review'}</ButtonText>
                    </Button>
                </Box>
            </KeyboardAvoidingView>

            <AlertDialog
                isOpen={isAlertDialogOpen}
                onClose={() => setIsAlertDialogOpen(false)}
            >
                <AlertDialogBackdrop />
                <AlertDialogContent className='rounded-2xl'>
                    <AlertDialogHeader>
                        <Heading size="lg" className="text-typography-950 font-semibold">Delete Review</Heading>
                    </AlertDialogHeader>
                    <AlertDialogBody className="mt-3 mb-4">
                        <Text size="md">
                            Are you sure you want to delete your review? This action cannot be undone.
                        </Text>
                    </AlertDialogBody>
                    <AlertDialogFooter>
                        <Button
                            variant="outline"
                            action="secondary"
                            onPress={() => setIsAlertDialogOpen(false)}
                            size="md"
                        >
                            <ButtonText>Cancel</ButtonText>
                        </Button>
                        <Button
                            size="md"
                            action="negative"
                            onPress={() => {
                                setIsAlertDialogOpen(false);
                                handleDeleteReview();
                            }}
                        >
                            <ButtonText>Delete</ButtonText>
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Box>
    );
}
