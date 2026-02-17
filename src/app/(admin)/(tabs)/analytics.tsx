import { Card } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAnalytics } from '@/src/hooks/useAnalytics';
import useThemeConfig from '@/src/hooks/useThemeConfig';
import { useRouter } from 'expo-router';
import { Archive, ChevronRight, MapPin, Navigation, TrendingUp } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

const AnalyticsScreen = () => {
    const router = useRouter();
    const { data, isLoading, error } = useAnalytics();

    const { primary, typography } = useThemeConfig()

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

                {/* Least Popular Places */}
                <VStack className="mb-8 gap-4">
                    <Heading size="md" className="text-typography-900">Least Popular Places</Heading>
                    <Card className="p-0 overflow-hidden bg-background-50 border border-outline-100 rounded-xl">
                        {data?.lowestLandmarks.map((place, index) => (
                            <TouchableOpacity
                                key={place.id}
                                activeOpacity={0.7}
                                onPress={() => router.push({ pathname: '/(admin)/landmark/[id]', params: { id: place.id } })}
                            >
                                <HStack className={`p-4 items-center justify-between border-b border-outline-50 ${index === data.lowestLandmarks.length - 1 ? 'border-b-0' : ''}`}>
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
                        {data?.lowestLandmarks.length === 0 && (
                            <View className="p-4">
                                <Text className="text-typography-500 italic">No data available yet.</Text>
                            </View>
                        )}
                    </Card>
                </VStack>

                {/* Category Distribution */}
                <VStack className="gap-4">
                    <Heading size="md" className="text-typography-900">Category Distribution</Heading>
                    <Card className="p-4 bg-background-50 border border-outline-100 rounded-xl items-center overflow-hidden">
                        {data?.categoryDistribution && data.categoryDistribution.length > 0 ? (
                            <BarChart
                                data={data.categoryDistribution.map((item) => ({
                                    value: item.count,
                                    label: item.type?.toLowerCase().replace('_', ' '),
                                    frontColor: primary['500'],
                                }))}
                                barWidth={32}
                                noOfSections={4}
                                barBorderRadius={4}
                                frontColor={primary['500']}
                                yAxisThickness={0}
                                xAxisThickness={0}
                                yAxisTextStyle={{ color: typography['500'] }}
                                xAxisLabelTextStyle={{ color: typography['700'], fontSize: 10, textTransform: 'capitalize' }} // typography-700
                                hideRules
                                showYAxisIndices={false}
                                width={280} // Slight adjustment to prevent clipping
                                height={150}
                                isAnimated
                            />
                        ) : (
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
