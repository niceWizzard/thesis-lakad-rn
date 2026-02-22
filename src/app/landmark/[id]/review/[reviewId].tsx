import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Flag, Star, Trash2, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView } from 'react-native';

import { AlertDialog, AlertDialogBackdrop, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader } from '@/components/ui/alert-dialog';
import { Box } from '@/components/ui/box';
import { Button, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { ChevronDownIcon, Icon } from '@/components/ui/icon';
import { Select, SelectBackdrop, SelectContent, SelectDragIndicator, SelectDragIndicatorWrapper, SelectIcon, SelectInput, SelectItem, SelectPortal, SelectTrigger } from '@/components/ui/select';
import { Text } from '@/components/ui/text';
import { Textarea, TextareaInput } from '@/components/ui/textarea';
import { VStack } from '@/components/ui/vstack';
import useThemeConfig from '@/src/hooks/useThemeConfig';
import { useToastNotification } from '@/src/hooks/useToastNotification';
import { useAuthStore } from '@/src/stores/useAuth';
import { fetchReviewByReviewId } from '@/src/utils/review/fetchReview';
import { supabase } from '@/src/utils/supabase';


export default function ReviewDetailScreen() {
    const { reviewId, adminMode } = useLocalSearchParams<{ reviewId: string, adminMode?: string }>();
    const { primary } = useThemeConfig();
    const { session } = useAuthStore();
    const { showToast } = useToastNotification();
    const queryClient = useQueryClient();
    const router = useRouter();

    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // new states for the report form
    const [reportReason, setReportReason] = useState<string>('');
    const [reportDetails, setReportDetails] = useState<string>('');

    const { data: review, isLoading, isError } = useQuery({
        queryKey: ['review_detail', reviewId],
        queryFn: () => fetchReviewByReviewId(reviewId!),
        enabled: !!reviewId,
    });

    if (isLoading) {
        return (
            <Box className="flex-1 bg-background-50 justify-center items-center">
                <Stack.Screen options={{ title: 'Review' }} />
                <ActivityIndicator size="large" color="#0891b2" />
            </Box>
        );
    }

    if (isError || !review) {
        return (
            <Box className="flex-1 bg-background-50 justify-center items-center p-8">
                <Stack.Screen options={{ title: 'Review' }} />
                <Text className="text-red-500 text-center">Failed to load review. Please try again.</Text>
            </Box>
        );
    }

    const handleDeleteReview = async () => {
        if (!review?.id) return;
        setIsDeleting(true);

        try {
            // Remove images associated with the review
            const imagesToRemove = (review.images || []).map((url: string) => {
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
                .eq('id', review.id);

            if (deleteError) throw deleteError;

            // Invalidate parent queries related to reviews
            if (review.landmark_id) {
                await queryClient.invalidateQueries({ queryKey: ['admin-landmark-reviews', review.landmark_id.toString()] });
                await queryClient.invalidateQueries({ queryKey: ['landmark-analytics', review.landmark_id.toString()] });
            }
            await queryClient.invalidateQueries({ queryKey: ['reviews'] });
            await queryClient.invalidateQueries({ queryKey: ['landmark-review'] });

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
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
        }
    };

    const handleReportReview = async () => {
        if (!session?.user?.id) return;

        if (!reportReason) {
            showToast({
                title: "Missing Reason",
                description: "Please select a reason for reporting.",
                action: "info",
            });
            return;
        }

        setIsSubmittingReport(true);
        try {
            const { error } = await supabase.from('review_reports').insert({
                review_id: Number(reviewId),
                reporter_id: session.user.id,
                reason: reportReason,
                details: reportDetails
            } as any);

            // Handle unique constraint error (usually indicates already reported)
            if (error?.code === '23505') {
                showToast({
                    title: "Notice",
                    description: "You have already reported this review.",
                    action: "info",
                });
                return;
            } else if (error) {
                throw error;
            }

            // Success
            showToast({
                title: "Report Submitted",
                description: "Thank you for letting us know. We will review this shortly.",
                action: "success",
            });
            setIsReportDialogOpen(false);
            setReportReason('');
            setReportDetails('');
        } catch (error) {
            console.error('Error reporting review:', error);
            showToast({
                title: "Error",
                description: "Failed to submit report. Please try again.",
                action: "error",
            });
        } finally {
            setIsSubmittingReport(false);
        }
    };

    const isOwnReview = session?.user?.id === review.user_id;
    const isAdminMode = adminMode === 'true';

    return (
        <Box className="flex-1 bg-background-50">
            <Stack.Screen
                options={{
                    title: 'Review',
                    headerRight: () => {
                        if (isAdminMode) {
                            return (
                                <Pressable
                                    onPress={() => setIsDeleteDialogOpen(true)}
                                    className="p-2 -mr-2 active:opacity-50"
                                >
                                    <Icon as={Trash2} size="md" className="text-error-500" />
                                </Pressable>
                            );
                        }

                        if (session?.user?.id && !isOwnReview) {
                            return (
                                <Pressable
                                    onPress={() => setIsReportDialogOpen(true)}
                                    className="p-2 -mr-2 active:opacity-50"
                                >
                                    <Icon as={Flag} size="md" className="text-typography-500" />
                                </Pressable>
                            );
                        }
                        return undefined;
                    }
                }}
            />
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
                <VStack space="lg" className="bg-background-0 rounded-3xl border border-outline-100 p-5">

                    {/* Author header */}
                    <HStack className="justify-between items-start">
                        <HStack className="items-center gap-3">
                            <Box className="w-12 h-12 rounded-full bg-primary-100 items-center justify-center">
                                <Icon as={User} size="md" className="text-primary-600" />
                            </Box>
                            <VStack>
                                <Text className="font-semibold text-typography-900">
                                    {review.author_name || 'Lakbay User'}
                                </Text>
                                <Text size="xs" className="text-typography-500">
                                    {new Date(review.updated_at).toLocaleDateString(undefined, {
                                        year: 'numeric', month: 'long', day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </Text>
                            </VStack>
                        </HStack>

                        {/* Star rating */}
                        <HStack space="xs" className="items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    size={18}
                                    color={star <= (review.rating ?? 0) ? primary['500'] : '#d4d4d4'}
                                    fill={star <= (review.rating ?? 0) ? primary['500'] : 'none'}
                                />
                            ))}
                            <Text size="sm" className="font-bold text-typography-700 ml-1">
                                {review.rating ?? 0}
                            </Text>
                        </HStack>
                    </HStack>

                    {/* Review text */}
                    {review.content ? (
                        <Text size="md" className="text-typography-700 leading-relaxed">
                            {review.content}
                        </Text>
                    ) : (
                        <Text size="sm" className="text-typography-400 italic">No written review.</Text>
                    )}

                    {/* Images */}
                    {review.images && review.images.length > 0 && (
                        <VStack space="sm">
                            <Text size="xs" className="font-bold text-typography-500 uppercase tracking-wider">
                                Photos ({review.images.length})
                            </Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <HStack space="md">
                                    {review.images.map((uri: string, idx: number) => (
                                        <Image
                                            key={idx}
                                            source={{ uri }}
                                            className="w-72 rounded-2xl bg-background-100"
                                            style={{ height: 220 }}
                                            resizeMode="cover"
                                        />
                                    ))}
                                </HStack>
                            </ScrollView>
                        </VStack>
                    )}
                </VStack>
            </ScrollView>

            <AlertDialog
                isOpen={isReportDialogOpen}
                onClose={() => {
                    if (!isSubmittingReport) setIsReportDialogOpen(false);
                }}
            >
                <AlertDialogBackdrop />
                <AlertDialogContent className='rounded-3xl p-2'>
                    <AlertDialogHeader className="px-5 pt-5 pb-2">
                        <Heading size="xl" className="text-typography-950 font-bold">Report Review</Heading>
                    </AlertDialogHeader>
                    <AlertDialogBody className="px-5 pb-5">
                        <VStack space="xl">
                            <Text size="sm" className="text-typography-500 leading-snug">
                                Help us maintain a safe community. Please let us know why this review should be removed.
                            </Text>

                            <VStack space="xs">
                                <HStack className="items-center">
                                    <Text size="sm" className="font-semibold text-typography-900">Reason</Text>
                                    <Text size="xs" className="text-error-500 ml-1">*</Text>
                                </HStack>
                                <Select onValueChange={setReportReason} selectedValue={reportReason}>
                                    <SelectTrigger variant="outline" size="md" className="rounded-xl border-outline-200 focus:border-primary-500">
                                        <SelectInput placeholder="Select an option" className="text-typography-900" />
                                        <SelectIcon className="mr-3" as={ChevronDownIcon} />
                                    </SelectTrigger>
                                    <SelectPortal>
                                        <SelectBackdrop />
                                        <SelectContent className="rounded-t-3xl pb-8">
                                            <SelectDragIndicatorWrapper>
                                                <SelectDragIndicator />
                                            </SelectDragIndicatorWrapper>
                                            <VStack className="w-full px-2" space="sm">
                                                <SelectItem label="Spam or misleading" value="Spam" className="rounded-lg" />
                                                <SelectItem label="Inappropriate or offensive content" value="Inappropriate Content" className="rounded-lg" />
                                                <SelectItem label="Harassment or bullying" value="Harassment" className="rounded-lg" />
                                                <SelectItem label="Not relevant (Off-topic)" value="Off-topic" className="rounded-lg" />
                                            </VStack>
                                        </SelectContent>
                                    </SelectPortal>
                                </Select>
                            </VStack>

                            <VStack space="xs">
                                <Text size="sm" className="font-semibold text-typography-900">Additional Details (Optional)</Text>
                                <Textarea className="w-full rounded-xl border-outline-200 focus:border-primary-500 min-h-[100px]">
                                    <TextareaInput
                                        placeholder="Provide more details about your report..."
                                        value={reportDetails}
                                        onChangeText={setReportDetails}
                                        className="text-typography-900 text-sm p-3"
                                        textAlignVertical="top"
                                    />
                                </Textarea>
                            </VStack>
                        </VStack>
                    </AlertDialogBody>
                    <AlertDialogFooter className="px-5 pb-5 pt-0">
                        <Button
                            variant="outline"
                            action="secondary"
                            onPress={() => setIsReportDialogOpen(false)}
                            size="md"
                            isDisabled={isSubmittingReport}
                            className="rounded-xl flex-1 mr-3 border-outline-200"
                        >
                            <ButtonText className="text-typography-600 font-medium">Cancel</ButtonText>
                        </Button>
                        <Button
                            size="md"
                            action="negative"
                            onPress={handleReportReview}
                            isDisabled={isSubmittingReport}
                            className="rounded-xl flex-1 bg-error-600"
                        >
                            {isSubmittingReport && <ButtonSpinner color="white" />}
                            <ButtonText className="font-semibold text-white">Report Review</ButtonText>
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => !isDeleting && setIsDeleteDialogOpen(false)}
            >
                <AlertDialogBackdrop />
                <AlertDialogContent className='rounded-2xl'>
                    <AlertDialogHeader>
                        <Heading size="lg" className="text-typography-950 font-semibold">Delete Review</Heading>
                    </AlertDialogHeader>
                    <AlertDialogBody className="mt-3 mb-4">
                        <Text size="md">
                            Are you sure you want to delete this review by {review?.author_name}? This action cannot be undone.
                        </Text>
                    </AlertDialogBody>
                    <AlertDialogFooter>
                        <Button
                            variant="outline"
                            action="secondary"
                            onPress={() => setIsDeleteDialogOpen(false)}
                            size="md"
                            isDisabled={isDeleting}
                        >
                            <ButtonText>Cancel</ButtonText>
                        </Button>
                        <Button
                            size="md"
                            action="negative"
                            onPress={handleDeleteReview}
                            isDisabled={isDeleting}
                        >
                            {isDeleting ? <ButtonSpinner color="white" className="mr-2" /> : null}
                            <ButtonText>Delete</ButtonText>
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Box>
    );
}
