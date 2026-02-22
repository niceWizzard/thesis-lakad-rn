import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Select, SelectBackdrop, SelectContent, SelectDragIndicator, SelectDragIndicatorWrapper, SelectIcon, SelectInput, SelectItem, SelectPortal, SelectTrigger } from '@/components/ui/select';
import { Text } from '@/components/ui/text';
import { ReviewWithAuthor } from '@/src/model/review.types';
import { useAuthStore } from '@/src/stores/useAuth';
import { fetchMyReviews } from '@/src/utils/review/fetchReview';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { ChevronDown, MessageSquare, Search, Star } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, ListRenderItem, ScrollView, View } from 'react-native';

type SortOption = 'newest' | 'oldest' | 'highest_rating' | 'lowest_rating';

// Create a map to display the correct label for the selected value
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

export default function MyReviewsScreen() {
    const { session } = useAuthStore();
    const router = useRouter();
    const queryClient = useQueryClient();

    // Filters & Sorting
    const [searchQuery, setSearchQuery] = useState('');
    const [ratingFilter, setRatingFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<SortOption>('newest');



    const { data: reviews = [], isLoading } = useQuery({
        queryKey: ['my_reviews', session?.user?.id],
        queryFn: () => fetchMyReviews(session!.user.id),
        enabled: !!session?.user?.id,
    });

    useFocusEffect(
        useCallback(() => {
            if (session?.user?.id) {
                queryClient.invalidateQueries({ queryKey: ['my_reviews', session.user.id] });
            }
        }, [session?.user?.id, queryClient])
    );

    const filteredAndSortedReviews = React.useMemo(() => {
        let result = [...reviews];

        // Apply Search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(review =>
                review.landmark?.name?.toLowerCase().includes(query) ||
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

    const renderReviewItem: ListRenderItem<ReviewWithAuthor & { landmark: any }> = ({ item }) => {
        return (
            <Box className="bg-background-0 p-4 mb-4 rounded-2xl border border-outline-100 shadow-sm mx-4">
                <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1 mr-4">
                        <Text className="font-bold text-lg text-typography-900 mb-1" numberOfLines={1}>
                            {item.landmark?.name || 'Unknown Landmark'}
                        </Text>
                        <Text className="text-xs text-typography-500 mb-2">
                            {new Date(item.updated_at).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'numeric',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </Text>
                    </View>
                    <View className="bg-primary-50 px-2 py-1 rounded-full flex-row items-center">
                        <Icon as={Star} size="sm" className="text-primary-600 mr-1" fill="currentColor" />
                        <Text className="text-primary-700 font-bold text-sm">
                            {item.rating?.toFixed(1) || 'N/A'}
                        </Text>
                    </View>
                </View>

                {item.content ? (
                    <Text className="text-typography-700 mb-4" numberOfLines={3}>
                        {item.content}
                    </Text>
                ) : (
                    <Text className="text-typography-400 italic mb-4">No written content.</Text>
                )}
                {item.images && item.images.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 mt-2">
                        <HStack space="md">
                            {
                                item.images.map((image, index) => (
                                    <Image
                                        key={`${item.id}-image-${index}`}
                                        source={{ uri: image }}
                                        className="w-72 h-48 rounded-lg bg-background-100"
                                        alt="Review image"
                                        resizeMode='cover'
                                    />
                                ))
                            }
                        </HStack>
                    </ScrollView>
                )}

                <HStack className="justify-end border-t border-outline-50 pt-3" space='sm'>
                    <Button
                        size="sm"
                        action="secondary"
                        variant="outline"
                        onPress={() => item.landmark_id && router.navigate({
                            pathname: '/landmark/[id]/view',
                            params: {
                                id: item.landmark_id
                            }
                        })}
                    >
                        <ButtonText>View Landmark </ButtonText>
                    </Button>
                    <Button
                        size="sm"
                        action="secondary"
                        variant="solid"
                        onPress={() => item.landmark_id && router.navigate({
                            pathname: '/landmark/[id]/review',
                            params: {
                                id: item.landmark_id,
                            }
                        })}
                    >
                        <ButtonText>Edit</ButtonText>
                    </Button>
                </HStack>
            </Box>
        );
    };

    return (
        <View className="flex-1 bg-background-50">
            <Stack.Screen
                options={{
                    title: 'My Reviews',
                }}
            />

            {/* Filters Section */}
            <View className="bg-background-0 px-4 py-4 border-b border-outline-100 shadow-soft-1 mb-2 z-10">
                <Input className="mb-3 rounded-xl bg-background-50">
                    <InputSlot className="pl-3">
                        <InputIcon as={Search} size="sm" className="text-typography-400" />
                    </InputSlot>
                    <InputField
                        placeholder="Search landmark or review..."
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
                            <SelectTrigger className="rounded-xl flex-row justify-between items-center bg-background-50 border-outline-200">
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
                            <SelectTrigger className="rounded-xl flex-row justify-between items-center bg-background-50 border-outline-200">
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

            {/* Content */}
            {isLoading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" className="text-primary-500" />
                </View>
            ) : filteredAndSortedReviews.length === 0 ? (
                <View className="flex-1 justify-center items-center px-8">
                    <Icon as={MessageSquare} size="xl" className="text-typography-300 mb-4" />
                    <Heading size="md" className="text-typography-700 text-center mb-2">No Reviews Found</Heading>
                    <Text className="text-typography-500 text-center">
                        {searchQuery || ratingFilter !== 'all'
                            ? "Try adjusting your filters or search query."
                            : "You haven't written any reviews yet."}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredAndSortedReviews}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderReviewItem}
                    contentContainerStyle={{ paddingVertical: 16 }}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}
