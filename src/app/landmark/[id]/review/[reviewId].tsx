import { supabase } from '@/src/utils/supabase';
import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Star, User } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Image, ScrollView } from 'react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import useThemeConfig from '@/src/hooks/useThemeConfig';

async function fetchReviewByReviewId(reviewId: string) {
    const { data, error } = await supabase
        .from('landmark_reviews')
        .select('id, rating, content, images, created_at, user_id')
        .eq('id', Number(reviewId!))
        .single();

    if (error) throw error;
    if (!data) return null;

    // Fetch author profile
    let author_name: string | null = null;
    if (data.user_id) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', data.user_id as any)
            .maybeSingle();

        if (profile?.full_name) {
            author_name = profile.full_name;
        }
    }

    const publicUrls = (data.images || []).map((img: string) => {
        if (img.includes('supabase.co')) return img;
        return supabase.storage.from('images').getPublicUrl(img).data.publicUrl;
    });

    return { ...data, images: publicUrls, author_name };
}

export default function ReviewDetailScreen() {
    const { reviewId } = useLocalSearchParams<{ reviewId: string }>();
    const { primary } = useThemeConfig();

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

    return (
        <Box className="flex-1 bg-background-50">
            <Stack.Screen options={{ title: 'Review' }} />
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
                                    {new Date(review.created_at).toLocaleDateString(undefined, {
                                        year: 'numeric', month: 'long', day: 'numeric',
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
                            <VStack space="md">
                                {review.images.map((uri: string, idx: number) => (
                                    <Image
                                        key={idx}
                                        source={{ uri }}
                                        className="w-full rounded-2xl bg-background-100"
                                        style={{ height: 220 }}
                                        resizeMode="cover"
                                    />
                                ))}
                            </VStack>
                        </VStack>
                    )}
                </VStack>
            </ScrollView>
        </Box>
    );
}
