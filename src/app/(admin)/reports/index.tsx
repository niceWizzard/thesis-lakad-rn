import { useQuery } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { AlertCircle, ChevronRight, MessageSquareOff, XCircle } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, TouchableOpacity, View } from 'react-native';

import { Badge, BadgeText } from '@/components/ui/badge';
import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

import useThemeConfig from '@/src/hooks/useThemeConfig';
import { fetchAdminReports, ReportWithDetails, ReviewReportStatus } from '@/src/utils/admin/reports';

const formatDate = (dateStr: string) =>
    new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateStr));

export default function AdminReportsScreen() {
    const router = useRouter();
    const { primary } = useThemeConfig();
    const [statusFilter, setStatusFilter] = useState<ReviewReportStatus>('PENDING');

    const { data: reports, isLoading, isError, refetch, isRefetching } = useQuery({
        queryKey: ['admin-reports', statusFilter],
        queryFn: () => fetchAdminReports(statusFilter),
    });

    const statusTabs: { label: string; value: ReviewReportStatus; icon: any }[] = [
        { label: 'Pending', value: 'PENDING', icon: AlertCircle },
        { label: 'Dismissed', value: 'DISMISSED', icon: XCircle },
    ];

    const renderReportItem = ({ item }: { item: ReportWithDetails }) => {
        const reviewPreview = item.review_content
            ? (item.review_content.length > 80 ? item.review_content.substring(0, 80) + '...' : item.review_content)
            : 'No text content';

        return (
            <TouchableOpacity
                onPress={() => router.push(`/(admin)/reports/${item.id}`)}
                className="bg-background-0 p-4 rounded-3xl mx-4 mb-4 shadow-soft-1 border border-outline-50 active:scale-95 transition-transform"
            >
                <VStack space="sm">
                    <HStack className="justify-between items-center">
                        <Badge size="md" variant="solid" action={statusFilter === 'PENDING' ? 'error' : 'muted'} className="rounded-md">
                            <BadgeText>{item.reason}</BadgeText>
                        </Badge>
                        <Text size="xs" className="text-secondary-400 font-medium">
                            {formatDate(item.created_at)}
                        </Text>
                    </HStack>

                    <Box className="bg-background-50 p-3 rounded-2xl border border-outline-100 mt-1">
                        <Text size="sm" className="text-typography-800 italic" numberOfLines={2}>
                            &quot;{reviewPreview}&quot;
                        </Text>
                        {item.place_name && (
                            <Text size="xs" className="text-typography-500 mt-2 font-medium">
                                Review on: {item.place_name}
                            </Text>
                        )}
                    </Box>

                    <HStack className="justify-between items-center mt-2">
                        <Text size="xs" className="text-typography-500">
                            Reported by: <Text className="font-semibold text-typography-700">{item.reporter_name || 'Unknown User'}</Text>
                        </Text>
                        <HStack className="items-center" space="xs">
                            <Text size="xs" className="text-primary-600 font-bold uppercase tracking-wider">Review</Text>
                            <Icon as={ChevronRight} size="sm" className="text-primary-600" />
                        </HStack>
                    </HStack>
                </VStack>
            </TouchableOpacity>
        );
    };

    return (
        <Box className="flex-1 bg-background-50">
            <Stack.Screen
                options={{
                    headerTitle: "Review Reports",
                }}
            />

            {/* Status Tabs */}
            <View className="px-4 py-3 bg-background-50 border-b border-outline-100 z-10">
                <HStack space="md" className="justify-between">
                    {statusTabs.map((tab) => {
                        const isSelected = statusFilter === tab.value;
                        return (
                            <TouchableOpacity
                                key={tab.value}
                                onPress={() => setStatusFilter(tab.value)}
                                className={`flex-1 py-2.5 px-3 rounded-xl flex-row justify-center items-center gap-2 border ${isSelected
                                    ? 'bg-primary-50 border-primary-200'
                                    : 'bg-background-0 border-outline-100'
                                    }`}
                            >
                                <Icon
                                    as={tab.icon}
                                    size="sm"
                                    className={isSelected ? "text-primary-600" : "text-typography-400"}
                                />
                                <Text
                                    size="sm"
                                    className={`font-semibold ${isSelected ? "text-primary-700" : "text-typography-500"}`}
                                >
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </HStack>
            </View>

            {/* Content List */}
            {isLoading && !isRefetching ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color={primary['500']} />
                </View>
            ) : isError ? (
                <View className="flex-1 justify-center items-center p-8">
                    <Text className="text-error-500 text-center text-lg font-medium">Failed to load reports.</Text>
                    <TouchableOpacity onPress={() => refetch()} className="mt-4 bg-primary-500 px-6 py-3 rounded-full">
                        <Text className="text-white font-bold">Try Again</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={reports}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderReportItem}
                    contentContainerStyle={{ paddingVertical: 16, flexGrow: 1 }}
                    refreshControl={
                        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
                    }
                    ListEmptyComponent={
                        <View className="flex-1 justify-center items-center p-8 mt-20">
                            <Box className="bg-primary-50 p-6 rounded-full mb-6">
                                <Icon as={MessageSquareOff} size="xl" className="text-primary-400 w-12 h-12" />
                            </Box>
                            <Heading size="lg" className="text-typography-900 mb-2 text-center">All caught up!</Heading>
                            <Text size="md" className="text-typography-500 text-center">
                                There are no {statusFilter.replace('_', ' ').toLowerCase()} reports right now.
                            </Text>
                        </View>
                    }
                />
            )}
        </Box>
    );
}
