import { Card } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAnalytics } from '@/src/hooks/useAnalytics';
import { Archive, MapPin, Navigation, TrendingUp } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';

const AnalyticsScreen = () => {
    const { data, isLoading, error } = useAnalytics();

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-background-0">
                <ActivityIndicator size="large" color="#000" />
            </View>
        );
    }

    if (error) {
        return (
            <View className="flex-1 justify-center items-center bg-background-0 p-4">
                <Text className="text-error-500">Failed to load analytics data.</Text>
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-background-0" contentContainerStyle={{ paddingBottom: 100 }}>
            <View className="p-4 pt-10">
                <Heading size="2xl" className="text-typography-900 mb-6">Overview</Heading>

                {/* Summary Cards */}
                <View className="flex-row flex-wrap gap-3 mb-8">
                    <SummaryCard
                        title="Total Itineraries"
                        value={data?.totalItineraries || 0}
                        icon={Navigation}
                        color="text-primary-500"
                    />
                    <SummaryCard
                        title="Active Places"
                        value={data?.activeLandmarks || 0}
                        icon={MapPin}
                        color="text-primary-500"
                    />
                    <SummaryCard
                        title="Archived"
                        value={data?.archivedLandmarks || 0}
                        icon={Archive}
                        color="text-tertiary-500"
                    />
                    <SummaryCard
                        title="Km Planned"
                        value={Math.round((data?.totalDistance || 0) / 1000)}
                        icon={TrendingUp}
                        color="text-info-500"
                    />
                </View>

                {/* Popular Places */}
                <VStack className="mb-8 gap-4">
                    <Heading size="md" className="text-typography-900">Most Popular Places</Heading>
                    <Card className="p-0 overflow-hidden bg-background-50 border border-outline-100 rounded-xl">
                        {data?.topLandmarks.map((place, index) => (
                            <HStack key={place.name} className={`p-4 items-center justify-between border-b border-outline-50 ${index === data.topLandmarks.length - 1 ? 'border-b-0' : ''}`}>
                                <HStack className="items-center gap-3">
                                    <View className="w-8 h-8 rounded-full bg-background-200 items-center justify-center">
                                        <Text className="font-bold text-typography-500">{index + 1}</Text>
                                    </View>
                                    <Text className="font-medium text-typography-900">{place.name}</Text>
                                </HStack>
                                <Text className="font-bold text-typography-700">{place.count} visits</Text>
                            </HStack>
                        ))}
                        {data?.topLandmarks.length === 0 && (
                            <View className="p-4">
                                <Text className="text-typography-500 italic">No data available yet.</Text>
                            </View>
                        )}
                    </Card>
                </VStack>

                {/* Category Distribution */}
                <VStack className="gap-4">
                    <Heading size="md" className="text-typography-900">Category Distribution</Heading>
                    <Card className="p-4 bg-background-50 border border-outline-100 rounded-xl">
                        {data?.categoryDistribution.map((category) => (
                            <View key={category.type} className="mb-3">
                                <HStack className="justify-between mb-1">
                                    <Text className="text-sm font-medium text-typography-700 capitalize">
                                        {category.type?.toLowerCase().replace('_', ' ')}
                                    </Text>
                                    <Text className="text-sm text-typography-500">{category.count}</Text>
                                </HStack>
                                {/* Simple Bar Chart */}
                                <View className="h-2 w-full bg-background-200 rounded-full overflow-hidden">
                                    <View
                                        className="h-full bg-primary-500 rounded-full"
                                        style={{
                                            width: `${(category.count / (data.activeLandmarks || 1)) * 100}%`
                                        }}
                                    />
                                </View>
                            </View>
                        ))}
                        {data?.categoryDistribution.length === 0 && (
                            <Text className="text-typography-500 italic">No data available yet.</Text>
                        )}
                    </Card>
                </VStack>

            </View>
        </ScrollView>
    )
}

const SummaryCard = ({ title, value, icon, color }: { title: string; value: number; icon: any; color: string }) => (
    <Card className="w-[48%] mb-2 p-4 rounded-xl bg-background-50 border border-outline-100 shadow-sm">
        <View className={`w-10 h-10 rounded-full items-center justify-center mb-3`}>
            <Icon as={icon} size="xl" className={`rounded-full ${color}`} />
        </View>
        <Heading size="xl">{value}</Heading>
        <Text className="text-xs font-medium text-typography-500 uppercase tracking-wider">{title}</Text>
    </Card>
)

export default AnalyticsScreen
