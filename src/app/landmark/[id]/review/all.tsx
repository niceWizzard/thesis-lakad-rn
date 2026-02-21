import { useInfiniteQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronDown, Star, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, ScrollView, TouchableOpacity } from 'react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Select, SelectBackdrop, SelectContent, SelectDragIndicator, SelectDragIndicatorWrapper, SelectIcon, SelectInput, SelectItem, SelectPortal, SelectTrigger } from '@/components/ui/select';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

import useThemeConfig from '@/src/hooks/useThemeConfig';
import { ReviewWithAuthor } from '@/src/model/review.types';
import { useAuthStore } from '@/src/stores/useAuth';
import { fetchFilterableReviews } from '@/src/utils/review/fetchReview';

export default function AllReviewsScreen() {
    const { id } = useLocalSearchParams();
    const { primary } = useThemeConfig();
    const router = useRouter();

    const { session } = useAuthStore()
    const userId = session?.user.id;

    // Filters and sorting
    const [ratingFilter, setRatingFilter] = useState<number | undefined>(undefined);
    const [sortOption, setSortOption] = useState<string>('newest');

    // Map sortOption to API args
    const getSortArgs = () => {
        switch (sortOption) {
            case 'oldest': return { sortColumn: 'created_at', sortDescending: false };
            case 'highest': return { sortColumn: 'rating', sortDescending: true };
            case 'lowest': return { sortColumn: 'rating', sortDescending: false };
            case 'newest':
            default: return { sortColumn: 'created_at', sortDescending: true };
        }
    };

    const fetchReviewsPage = async ({ pageParam = 1 }) => {
        const { sortColumn, sortDescending } = getSortArgs();
        const results = await fetchFilterableReviews({
            landmarkId: id as string,
            pageNumber: pageParam,
            pageSize: 10,
            ratingFilter,
            sortColumn,
            sortDescending,
        });
        return {
            data: results,
            nextPage: results.length === 10 ? pageParam + 1 : undefined,
        };
    };

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
    } = useInfiniteQuery({
        queryKey: ['all_reviews', id, ratingFilter, sortOption],
        queryFn: fetchReviewsPage,
        getNextPageParam: (lastPage) => lastPage.nextPage,
    });


    const reviews = data?.pages.flatMap(page => page.data) || [];

    const renderReviewCard = ({ item }: { item: ReviewWithAuthor }) => {
        const isCurrentUserReview = item.user_id === userId;
        return (
            <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => {
                    if (isCurrentUserReview) {
                        router.navigate({
                            pathname: '/landmark/[id]/review',
                            params: { id: id as string },
                        });
                    } else {
                        router.navigate({
                            pathname: '/landmark/[id]/review/[reviewId]',
                            params: { id: id as string, reviewId: item.id.toString() },
                        });
                    }
                }}
            >
                <VStack space="sm" className="bg-background-0 p-4 rounded-2xl mb-4 border border-outline-100">
                    <HStack className="justify-between items-center mb-1">
                        <HStack className="items-center gap-2">
                            <Box className="w-8 h-8 rounded-full bg-primary-100 items-center justify-center">
                                <Icon as={User} size="sm" className="text-primary-600" />
                            </Box>
                            <VStack>
                                <Text size="sm" className="font-medium text-typography-900 truncate max-w-[150px]" numberOfLines={1}>
                                    {item.author_name || 'Lakbay User'}
                                    {isCurrentUserReview && ' (You)'}
                                </Text>
                                <Text size="xs" className="text-typography-500">
                                    {new Date(item.created_at).toLocaleDateString()}
                                </Text>
                            </VStack>
                        </HStack>
                        <HStack space="xs">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    size={14}
                                    color={star <= (item.rating ?? 0) ? primary['500'] : "#d4d4d4"}
                                    fill={star <= (item.rating ?? 0) ? primary['500'] : "none"} />
                            ))}
                        </HStack>
                    </HStack>
                    {item.content ? (
                        <Text size="sm" className="text-typography-600 mt-2" numberOfLines={4} ellipsizeMode="tail">
                            {item.content}
                        </Text>
                    ) : null}
                    {item.images && item.images.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
                            <HStack space="md">
                                {item.images.map((uri: string, imgIdx: number) => (
                                    <Image
                                        key={imgIdx}
                                        source={{ uri }}
                                        className="size-32 rounded-xl border border-outline-100 bg-background-100" />
                                ))}
                            </HStack>
                        </ScrollView>
                    )}
                </VStack>
            </TouchableOpacity>
        );
    };

    const filterOptions = [
        { label: 'All', value: undefined },
        { label: '5 Stars', value: 5 },
        { label: '4 Stars', value: 4 },
        { label: '3 Stars', value: 3 },
        { label: '2 Stars', value: 2 },
        { label: '1 Star', value: 1 },
    ];

    return (
        <Box className="flex-1 bg-background-50">
            <Stack.Screen options={{ title: 'All Reviews' }} />

            {/* Header controls */}
            <VStack className="bg-background-0 pt-2 pb-4 px-4 border-b border-outline-100 shadow-sm z-10">
                <HStack className="justify-between items-center mb-4 z-20">
                    <Text size="sm" className="font-bold text-typography-900">Sort by:</Text>
                    <Select
                        selectedValue={sortOption}
                        onValueChange={setSortOption}
                        className="w-48"
                    >
                        <SelectTrigger variant="outline" size="sm" className="justify-between rounded-xl">
                            <SelectInput placeholder="Sort option" />
                            <SelectIcon className="mr-3" as={ChevronDown} />
                        </SelectTrigger>
                        <SelectPortal>
                            <SelectBackdrop />
                            <SelectContent>
                                <SelectDragIndicatorWrapper>
                                    <SelectDragIndicator />
                                </SelectDragIndicatorWrapper>
                                <SelectItem label="Newest First" value="newest" />
                                <SelectItem label="Oldest First" value="oldest" />
                                <SelectItem label="Highest Rated" value="highest" />
                                <SelectItem label="Lowest Rated" value="lowest" />
                            </SelectContent>
                        </SelectPortal>
                    </Select>
                </HStack>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-grow-0">
                    <HStack space="sm" className="pr-4 pb-1">
                        {filterOptions.map((opt) => {
                            const isSelected = ratingFilter === opt.value;
                            return (
                                <Pressable
                                    key={opt.label}
                                    onPress={() => setRatingFilter(opt.value)}
                                    className={`px-4 py-2 rounded-full border ${isSelected ? 'bg-primary-600 border-primary-600' : 'bg-background-50 border-outline-200'}`}
                                >
                                    <HStack space="xs" className="items-center">
                                        <Text size="sm" className={`font-medium ${isSelected ? 'text-white' : 'text-typography-700'}`}>
                                            {opt.label}
                                        </Text>
                                        {opt.value !== undefined && (
                                            <Star size={12} color={isSelected ? "white" : "#fbbf24"} fill={isSelected ? "white" : "#fbbf24"} />
                                        )}
                                    </HStack>
                                </Pressable>
                            );
                        })}
                    </HStack>
                </ScrollView>
            </VStack>

            {/* List */}
            {isLoading && !reviews.length ? (
                <Box className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#0891b2" />
                </Box>
            ) : isError ? (
                <Box className="flex-1 justify-center items-center">
                    <Text className="text-red-500 text-center mx-4">Failed to load reviews. Please try again.</Text>
                </Box>
            ) : reviews.length === 0 ? (
                <Box className="flex-1 justify-center items-center p-10">
                    <Text className="text-typography-400 text-center">No reviews found with the selected filters.</Text>
                </Box>
            ) : (
                <FlatList
                    data={reviews}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => renderReviewCard({ item })}
                    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                    onEndReached={() => {
                        if (hasNextPage && !isFetchingNextPage) {
                            fetchNextPage();
                        }
                    }}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                        isFetchingNextPage ? (
                            <Box className="py-4 items-center">
                                <ActivityIndicator size="small" color="#0891b2" />
                            </Box>
                        ) : null
                    }
                />
            )}
        </Box>
    );
}
