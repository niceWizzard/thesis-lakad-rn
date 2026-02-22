import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { ChevronDown, Search, Star, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, View } from 'react-native';

import { AlertDialog, AlertDialogBackdrop, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader } from '@/components/ui/alert-dialog';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Select, SelectBackdrop, SelectContent, SelectDragIndicator, SelectDragIndicatorWrapper, SelectIcon, SelectInput, SelectItem, SelectPortal, SelectTrigger } from '@/components/ui/select';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import useThemeConfig from '@/src/hooks/useThemeConfig';
import { useToastNotification } from '@/src/hooks/useToastNotification';
import { fetchFilterableReviews } from '@/src/utils/review/fetchReview';
import { supabase } from '@/src/utils/supabase';

const PAGE_SIZE = 50; // Increased to ensure client-side filter works reasonably well until scrolled far

type SortOption = 'newest' | 'oldest' | 'highest_rating' | 'lowest_rating';

const ratingLabels: Record<string, string> = {
    'all': 'All Ratings',
    '5': '5 Stars',
    '4': '4 Stars',
    '3': '3 Stars',
    '2': '2 Stars',
    '1': '1 Star',
};

const sortLabels: Record<SortOption, string> = {
    'newest': 'Newest First',
    'oldest': 'Oldest First',
    'highest_rating': 'Highest Rating',
    'lowest_rating': 'Lowest Rating',
};

export default function AdminReviewsScreen() {
    const { id } = useLocalSearchParams();
    const { primary } = useThemeConfig();
    const { showToast } = useToastNotification();
    const queryClient = useQueryClient();

    const [isDeleting, setIsDeleting] = useState(false);
    const [reviewToDelete, setReviewToDelete] = useState<any | null>(null);

    // Filters & Sorting
    const [searchQuery, setSearchQuery] = useState('');
    const [ratingFilter, setRatingFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<SortOption>('newest');

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isRefetching,
        refetch,
        error
    } = useInfiniteQuery(
        ['admin-landmark-reviews', id],
        ({ pageParam = 1 }) => fetchFilterableReviews({
            placeId: id as string,
            pageNumber: pageParam,
            pageSize: PAGE_SIZE,
            sortColumn: 'created_at',
            sortDescending: true,
        }),
        {
            getNextPageParam: (lastPage, allPages) => {
                if (lastPage.length < PAGE_SIZE) return undefined;
                return allPages.length + 1;
            },
            enabled: !!id,
        }
    );

    const reviews = React.useMemo(() => data?.pages.flat() || [], [data?.pages]);

    const filteredAndSortedReviews = React.useMemo(() => {
        let result = [...reviews];

        // Apply Search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(review =>
                review.author_name?.toLowerCase().includes(query) ||
                review.content?.toLowerCase().includes(query)
            );
        }

        // Apply Rating Filter
        if (ratingFilter !== 'all') {
            const minRating = Number(ratingFilter);
            result = result.filter(review => review.rating !== null && review.rating >= minRating && review.rating < minRating + 1);
        }

        // Apply Sort
        result.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
                case 'oldest':
                    return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
                case 'highest_rating':
                    return (b.rating || 0) - (a.rating || 0);
                case 'lowest_rating':
                    return (a.rating || 0) - (b.rating || 0);
                default:
                    return 0;
            }
        });

        return result;
    }, [reviews, searchQuery, ratingFilter, sortBy]);

    const confirmDelete = (review: any) => {
        setReviewToDelete(review);
    };

    const handleDeleteReview = async () => {
        if (!reviewToDelete?.id) return;
        setIsDeleting(true);

        try {
            // Remove images associated with the review
            const imagesToRemove = (reviewToDelete.images || []).map((url: string) => {
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
                .from('reviews')
                .delete()
                .eq('id', reviewToDelete.id);

            if (deleteError) throw deleteError;

            await queryClient.invalidateQueries({ queryKey: ['admin-landmark-reviews', id] });
            await queryClient.invalidateQueries({ queryKey: ['landmark-analytics', id] }); // invalidate analytics to refresh counts

            showToast({
                title: "Success",
                description: "Review deleted successfully.",
                action: "success",
            });
        } catch (error) {
            console.error('Error deleting review:', error);
            showToast({
                title: "Error",
                description: "Failed to delete review. Please try again.",
                action: "error",
            });
        } finally {
            setIsDeleting(false);
            setReviewToDelete(null);
        }
    };

    const renderReviewCard = ({ item }: { item: any }) => (
        <Link
            href={{
                pathname: '/place/[id]/review/[reviewId]',
                params: { id: item.landmark_id, reviewId: item.id, adminMode: 'true' }
            }}
            asChild
        >
            <Pressable>
                <Card className="m-4 mt-0 p-4 rounded-xl shadow-sm border border-outline-100 bg-background-50">
                    <HStack className="justify-between items-start mb-3">
                        <VStack>
                            <Heading size="sm" className="text-typography-900">{item.author_name}</Heading>
                            <HStack space="xs" className="mt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        size={12}
                                        color={star <= item.rating ? "#f59e0b" : "#e5e5e5"}
                                        fill={star <= item.rating ? "#f59e0b" : "none"}
                                    />
                                ))}
                            </HStack>
                        </VStack>
                        <HStack space="md" className="items-center">
                            <Text size="xs" className="text-typography-500 text-right">
                                {new Date(item.updated_at).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'numeric',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </Text>
                            <Pressable onPress={() => confirmDelete(item)} className="p-2 -mr-2 -mt-2 active:opacity-50">
                                <Icon as={Trash2} size="md" className="text-error-500" />
                            </Pressable>
                        </HStack>
                    </HStack>

                    {item.content ? (
                        <Text className="text-typography-700 mb-3">{item.content}</Text>
                    ) : null}

                    {item.images && item.images.length > 0 && (
                        <HStack space="sm" className="mt-2">
                            {item.images.map((img: string, index: number) => (
                                <Image
                                    key={index}
                                    source={{ uri: img }}
                                    className="w-20 h-20 rounded-lg bg-outline-100"
                                    resizeMode="cover"
                                />
                            ))}
                        </HStack>
                    )}
                </Card>
            </Pressable>
        </Link>
    );

    return (
        <Box className="flex-1 bg-background-0">
            <Stack.Screen options={{ title: 'Manage Reviews' }} />

            {/* Filters Section */}
            <View className="bg-background-50 px-4 py-4 border-b border-outline-100 shadow-soft-1 mb-2 z-10">
                <Input className="mb-3 rounded-xl bg-background-0">
                    <InputSlot className="pl-3">
                        <InputIcon as={Search} size="sm" className="text-typography-400" />
                    </InputSlot>
                    <InputField
                        placeholder="Search author or review content..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </Input>

                <View className="flex-row gap-2 z-20">
                    <View className="flex-1">
                        <Select
                            selectedValue={ratingFilter}
                            onValueChange={(val) => {
                                setRatingFilter(val);
                                // Reset sort to newest if they are currently sorting by rating
                                if (val !== 'all' && (sortBy === 'highest_rating' || sortBy === 'lowest_rating')) {
                                    setSortBy('newest');
                                }
                            }}
                        >
                            <SelectTrigger className="rounded-xl flex-row justify-between items-center bg-background-0 border-outline-200">
                                <SelectInput placeholder="Rating" value={ratingLabels[ratingFilter]} />
                                <SelectIcon as={ChevronDown} className="mr-3" />
                            </SelectTrigger>
                            <SelectPortal>
                                <SelectBackdrop />
                                <SelectContent>
                                    <SelectDragIndicatorWrapper>
                                        <SelectDragIndicator />
                                    </SelectDragIndicatorWrapper>
                                    <SelectItem label="All Ratings" value="all" />
                                    <SelectItem label="5 Stars" value="5" />
                                    <SelectItem label="4 Stars" value="4" />
                                    <SelectItem label="3 Stars" value="3" />
                                    <SelectItem label="2 Stars" value="2" />
                                    <SelectItem label="1 Star" value="1" />
                                </SelectContent>
                            </SelectPortal>
                        </Select>
                    </View>

                    <View className="flex-1 z-30">
                        <Select
                            selectedValue={sortBy}
                            onValueChange={(val) => setSortBy(val as SortOption)}
                        >
                            <SelectTrigger className="rounded-xl flex-row justify-between items-center bg-background-0 border-outline-200">
                                <SelectInput placeholder="Sort By" value={sortLabels[sortBy]} />
                                <SelectIcon as={ChevronDown} className="mr-3" />
                            </SelectTrigger>
                            <SelectPortal>
                                <SelectBackdrop />
                                <SelectContent>
                                    <SelectDragIndicatorWrapper>
                                        <SelectDragIndicator />
                                    </SelectDragIndicatorWrapper>
                                    <SelectItem label="Newest First" value="newest" />
                                    <SelectItem label="Oldest First" value="oldest" />
                                    {ratingFilter === 'all' && (
                                        <>
                                            <SelectItem label="Highest Rating" value="highest_rating" />
                                            <SelectItem label="Lowest Rating" value="lowest_rating" />
                                        </>
                                    )}
                                </SelectContent>
                            </SelectPortal>
                        </Select>
                    </View>
                </View>
            </View>

            {isLoading && !isRefetching ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color={primary['500']} />
                </View>
            ) : error ? (
                <View className="flex-1 justify-center items-center p-4">
                    <Text className="text-error-500 text-center">Failed to load reviews.</Text>
                    <Button className="mt-4" onPress={() => refetch()} variant="outline">
                        <ButtonText>Try Again</ButtonText>
                    </Button>
                </View>
            ) : filteredAndSortedReviews.length === 0 ? (
                <View className="flex-1 justify-center items-center p-8 mt-10">
                    <Icon as={Star} size="xl" className="text-typography-400 mb-4 opacity-50" />
                    <Heading size="md" className="text-typography-500 text-center">No Reviews Found</Heading>
                    <Text className="text-typography-400 text-center mt-2">
                        {searchQuery || ratingFilter !== 'all'
                            ? "Try adjusting your filters or search query."
                            : "There are no reviews for this landmark to display."}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredAndSortedReviews}
                    keyExtractor={(item: any) => item.id.toString()}
                    renderItem={renderReviewCard}
                    contentContainerStyle={{ paddingVertical: 16 }}
                    onEndReached={() => {
                        if (hasNextPage) fetchNextPage();
                    }}
                    onEndReachedThreshold={0.5}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={refetch}
                            colors={[primary['500']]}
                            tintColor={primary['500']}
                        />
                    }
                    ListFooterComponent={
                        isFetchingNextPage ? (
                            <View className="py-4 items-center">
                                <ActivityIndicator size="small" color={primary['500']} />
                            </View>
                        ) : null
                    }
                />
            )}

            <AlertDialog
                isOpen={!!reviewToDelete}
                onClose={() => !isDeleting && setReviewToDelete(null)}
            >
                <AlertDialogBackdrop />
                <AlertDialogContent className='rounded-2xl'>
                    <AlertDialogHeader>
                        <Heading size="lg" className="text-typography-950 font-semibold">Delete Review</Heading>
                    </AlertDialogHeader>
                    <AlertDialogBody className="mt-3 mb-4">
                        <Text size="md">
                            Are you sure you want to delete this review by {reviewToDelete?.author_name}? This action cannot be undone.
                        </Text>
                    </AlertDialogBody>
                    <AlertDialogFooter>
                        <Button
                            variant="outline"
                            action="secondary"
                            onPress={() => setReviewToDelete(null)}
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
                            {isDeleting ? <ActivityIndicator size="small" color="white" className="mr-2" /> : null}
                            <ButtonText>Delete</ButtonText>
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Box>
    );
}
