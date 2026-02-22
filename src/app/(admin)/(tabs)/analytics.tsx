import { Card } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAnalytics } from '@/src/hooks/useAnalytics';
import useThemeConfig from '@/src/hooks/useThemeConfig';
import { useRouter } from 'expo-router';
import { Archive, ChevronRight, MapPin, Navigation, Star, TrendingUp } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

const AnalyticsScreen = () => {
    const router = useRouter();
    const { data, isLoading, error, refetch } = useAnalytics();

    const { primary, tertiary, info, warning, success, typography } = useThemeConfig()

    const [refreshing, setRefreshing] = React.useState(false);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-background-0">
                <ActivityIndicator size="large" color={primary['500']} />
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

    // Chart Data Preparation
    const getBarColor = (index: number) => {
        const colors = [primary['500'], tertiary['500'], info['500'], warning['500'], success['500']];
        return colors[index % colors.length];
    };

    return (
        <ScrollView
            className="flex-1 bg-background-0"
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[primary['500']]} tintColor={primary['500']} />
            }
        >
            <View className="p-6 pt-10">
                <HStack className="items-center gap-3 mb-6">
                    <Heading size="2xl" className="text-typography-900">Overview</Heading>
                </HStack>

                {/* Summary Cards */}
                <View className="flex-row flex-wrap gap-2 mb-8 justify-between">
                    <SummaryCard
                        title="Total Itineraries"
                        value={data?.totalItineraries || 0}
                        icon={Navigation}
                        iconClassName="text-primary-600"
                        cardClassName="bg-primary-50 border-primary-200"
                    />
                    <SummaryCard
                        title="Active Places"
                        value={data?.activeLandmarks || 0}
                        icon={MapPin}
                        iconClassName="text-info-600"
                        cardClassName="bg-info-50 border-info-200"
                        onPress={() => router.push('/(admin)/(tabs)/places')}
                    />
                    <SummaryCard
                        title="Archived"
                        value={data?.archivedLandmarks || 0}
                        icon={Archive}
                        iconClassName="text-tertiary-600"
                        cardClassName="bg-tertiary-50 border-tertiary-200"
                        onPress={() => router.push('/(admin)/place/archived-places')}
                    />
                    <SummaryCard
                        title="Km Planned"
                        value={Math.round((data?.totalDistance || 0) / 1000)}
                        icon={TrendingUp}
                        iconClassName="text-warning-600"
                        cardClassName="bg-warning-50 border-warning-200"
                    />
                </View>

                {/* Popular Places */}
                <VStack className="mb-8 gap-4">
                    <HStack className="items-center gap-3">
                        <View className="w-1 h-6 rounded-full bg-info-500" />
                        <Heading size="lg" className="text-typography-900">Most Popular Places</Heading>
                    </HStack>
                    <Card className="p-0 overflow-hidden bg-background-50 border border-outline-100 rounded-xl">
                        {data?.topLandmarks.map((place, index) => (
                            <TouchableOpacity
                                key={place.id}
                                activeOpacity={0.7}
                                onPress={() => router.push({ pathname: '/(admin)/place/[id]/info/analytics', params: { id: place.id } })}
                            >
                                <HStack className={`p-4 items-center justify-between border-b border-outline-50 ${index === data.topLandmarks.length - 1 ? 'border-b-0' : ''}`}>
                                    <HStack className="items-center gap-3 flex-1 mr-4">
                                        <View
                                            className={`w-8 h-8 rounded-full items-center justify-center ${index === 0 ? 'bg-primary-100' : index === 1 ? 'bg-info-100' : index === 2 ? 'bg-tertiary-100' : 'bg-background-200'
                                                }`}
                                        >
                                            <Text
                                                className={`font-bold ${index === 0 ? 'text-primary-700' : index === 1 ? 'text-info-700' : index === 2 ? 'text-tertiary-700' : 'text-typography-500'
                                                    }`}
                                            >
                                                {index + 1}
                                            </Text>
                                        </View>
                                        <Text numberOfLines={1} ellipsizeMode="tail" className="flex-1">{place.name}</Text>
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

                {/* Highest Rated Places */}
                <VStack className="mb-8 gap-4">
                    <HStack className="items-center gap-3">
                        <View className="w-1 h-6 rounded-full bg-warning-500" />
                        <Heading size="lg" className="text-typography-900">Highest Rated Places</Heading>
                    </HStack>
                    <Card className="p-0 overflow-hidden bg-background-50 border border-outline-100 rounded-xl">
                        {data?.highestRatedLandmarks?.map((place, index) => (
                            <TouchableOpacity
                                key={place.id}
                                activeOpacity={0.7}
                                onPress={() => router.push({ pathname: '/(admin)/place/[id]/info/analytics', params: { id: place.id } })}
                            >
                                <HStack className={`p-4 items-center justify-between border-b border-outline-50 ${index === data.highestRatedLandmarks.length - 1 ? 'border-b-0' : ''}`}>
                                    <HStack className="items-center gap-3 flex-1 mr-4">
                                        <View
                                            className={`w-8 h-8 rounded-full items-center justify-center ${index === 0 ? 'bg-primary-100' : index === 1 ? 'bg-info-100' : index === 2 ? 'bg-tertiary-100' : 'bg-background-200'
                                                }`}
                                        >
                                            <Text
                                                className={`font-bold ${index === 0 ? 'text-primary-700' : index === 1 ? 'text-info-700' : index === 2 ? 'text-tertiary-700' : 'text-typography-500'
                                                    }`}
                                            >
                                                {index + 1}
                                            </Text>
                                        </View>
                                        <Text numberOfLines={1} ellipsizeMode="tail" className="flex-1">{place.name}</Text>
                                    </HStack>
                                    <HStack className="items-center gap-2">
                                        <Icon as={Star} size="sm" className="text-warning-500" fill="currentColor" />
                                        <Text className="font-bold text-typography-700">{place.rating.toFixed(1)}</Text>
                                        <Text className="text-typography-500 text-xs">({place.count})</Text>
                                        <Icon as={ChevronRight} size="xs" className="text-typography-400" />
                                    </HStack>
                                </HStack>
                            </TouchableOpacity>
                        ))}
                        {(!data?.highestRatedLandmarks || data.highestRatedLandmarks.length === 0) && (
                            <View className="p-4">
                                <Text className="text-typography-500 italic">No data available yet.</Text>
                            </View>
                        )}
                    </Card>
                </VStack>

                {/* Least Popular Places */}
                <VStack className="mb-8 gap-4">
                    <HStack className="items-center gap-3">
                        <View className="w-1 h-6 rounded-full bg-tertiary-500" />
                        <Heading size="lg" className="text-typography-900">Least Popular Places</Heading>
                    </HStack>
                    <Card className="p-0 overflow-hidden bg-background-50 border border-outline-100 rounded-xl">
                        {data?.lowestLandmarks.map((place, index) => (
                            <TouchableOpacity
                                key={place.id}
                                activeOpacity={0.7}
                                onPress={() => router.push({ pathname: '/(admin)/place/[id]/info/analytics', params: { id: place.id } })}
                            >
                                <HStack className={`p-4 items-center justify-between border-b border-outline-50 ${index === data.lowestLandmarks.length - 1 ? 'border-b-0' : ''}`}>
                                    <HStack className="items-center gap-3 flex-1 mr-4">
                                        <View className="w-8 h-8 rounded-full bg-background-200 items-center justify-center">
                                            <Text className="font-bold text-typography-500">{index + 1}</Text>
                                        </View>
                                        <Text numberOfLines={1} ellipsizeMode="tail" className="flex-1">{place.name}</Text>
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
                    <HStack className="items-center gap-3">
                        <View className="w-1 h-6 rounded-full bg-warning-500" />
                        <Heading size="lg" className="text-typography-900">Category Distribution</Heading>
                    </HStack>
                    <Card className="p-4 bg-background-50 border border-outline-100 rounded-xl items-center overflow-hidden">
                        {data?.categoryDistribution && data.categoryDistribution.length > 0 ? (
                            <BarChart
                                data={data.categoryDistribution.map((item, index) => ({
                                    value: item.count,
                                    label: item.type?.toLowerCase().replace('_', ' '),
                                    frontColor: getBarColor(index),
                                }))}
                                barWidth={32}
                                noOfSections={4}
                                barBorderRadius={4}
                                yAxisThickness={0}
                                xAxisThickness={0}
                                yAxisTextStyle={{ color: typography['500'] }}
                                xAxisLabelTextStyle={{ color: typography['700'], fontSize: 10, textTransform: 'capitalize' }}
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

const SummaryCard = ({
    title,
    value,
    icon,
    iconClassName,
    cardClassName,
    onPress
}: {
    title: string;
    value: number;
    icon: any;
    iconClassName?: string;
    cardClassName?: string;
    onPress?: () => void
}) => (
    <TouchableOpacity
        onPress={onPress}
        disabled={!onPress}
        className="w-[47%] mb-3"
        activeOpacity={0.7}
    >
        <Card
            className={`p-4 rounded-xl shadow-sm relative border ${cardClassName}`}
        >
            {onPress && (
                <View className="absolute top-4 right-4">
                    <Icon as={ChevronRight} size="xs" className="text-typography-400" />
                </View>
            )}
            <View className={`w-12 h-12 rounded-full items-center justify-center mb-3`}>
                <Icon as={icon} size="xl" className={`rounded-full ${iconClassName}`} />
            </View>
            <Heading size="xl" className="text-typography-900">{value}</Heading>
            <Text className="text-xs font-medium text-typography-600 uppercase tracking-wider">{title}</Text>
        </Card>
    </TouchableOpacity>
)

export default AnalyticsScreen

