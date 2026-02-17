import { Card } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAnalytics } from '@/src/hooks/useAnalytics';
import { useRouter } from 'expo-router';
import { Archive, ChevronRight, MapPin, Navigation, TrendingUp } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';

const AnalyticsScreen = () => {
    const router = useRouter();
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
                <View className="flex-row flex-wrap gap-2 mb-8">
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
                        onPress={() => router.push('/(admin)/(tabs)/places')}
                    />
                    <SummaryCard
                        title="Archived"
                        value={data?.archivedLandmarks || 0}
                        icon={Archive}
                        color="text-tertiary-500"
                        onPress={() => router.push('/(admin)/landmark/archived-places')}
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
                            <TouchableOpacity
                                key={place.id}
                                activeOpacity={0.7}
                                onPress={() => router.push({ pathname: '/(admin)/landmark/[id]', params: { id: place.id } })}
                            >
                                <HStack className={`p-4 items-center justify-between border-b border-outline-50 ${index === data.topLandmarks.length - 1 ? 'border-b-0' : ''}`}>
                                    <HStack className="items-center gap-3">
                                        <View className="w-8 h-8 rounded-full bg-background-200 items-center justify-center">
                                            <Text className="font-bold text-typography-500">{index + 1}</Text>
                                        </View>
                                        <Text className="font-medium text-typography-900">{place.name}</Text>
                                    </HStack>
                                    <HStack className="items-center gap-2">
                                        <Text className="font-bold text-typography-700">{place.count} visits</Text>
                                        <Icon as={ChevronRight} size="xs" className="text-typography-400" />
                                    </HStack>
                                </HStack>
                            </TouchableOpacity>
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

const SummaryCard = ({ title, value, icon, color, onPress }: { title: string; value: number; icon: any; color: string; onPress?: () => void }) => (
    <TouchableOpacity
        onPress={onPress}
        disabled={!onPress}
        className="w-[47%] mb-3"
        activeOpacity={0.7}
    >
        <Card className="p-4 rounded-xl bg-background-50 border border-outline-100 shadow-sm relative">
            {onPress && (
                <View className="absolute top-4 right-4">
                    <Icon as={ChevronRight} size="xs" className="text-typography-400" />
                </View>
            )}
            <View className={`w-12 h-12 rounded-full items-center justify-center mb-3 bg-background-100`}>
                <Icon as={icon} size="xl" className={`rounded-full ${color}`} />
            </View>
            <Heading size="xl">{value}</Heading>
            <Text className="text-xs font-medium text-typography-500 uppercase tracking-wider">{title}</Text>
        </Card>
    </TouchableOpacity>
)

export default AnalyticsScreen
