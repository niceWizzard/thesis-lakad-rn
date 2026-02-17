import { Card } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useLandmarkAnalytics } from '@/src/hooks/useLandmarkAnalytics';
import useThemeConfig from '@/src/hooks/useThemeConfig';
import { useGlobalSearchParams } from 'expo-router';
import { Activity, Map, TrendingUp } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

const LandmarkAnalyticsScreen = () => {
    const { id } = useGlobalSearchParams();
    const { data, isLoading, error } = useLandmarkAnalytics(id as string);
    const { primary, typography } = useThemeConfig();

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

    return (
        <ScrollView className="flex-1 bg-background-0" contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>

            {/* Summary Cards */}
            <View className="flex-row flex-wrap gap-3 mb-8 justify-between">
                <SummaryCard
                    title="Total Visits"
                    value={data?.totalVisits || 0}
                    icon={Map}
                    iconClassName="text-primary-600"
                    cardClassName="bg-primary-50 border-primary-200"
                />
                <SummaryCard
                    title="Distinct Itineraries"
                    value={data?.distinctItineraries || 0}
                    icon={TrendingUp}
                    iconClassName="text-secondary-600"
                    cardClassName="bg-secondary-50 border-secondary-200"
                />
            </View>

            {/* Monthly Trends */}
            <VStack className="gap-4">
                <HStack className="items-center gap-3">
                    <Icon as={Activity} className="text-tertiary-600" />
                    <Heading size="lg" className="text-typography-900">Visit Trends</Heading>
                </HStack>

                <Card className="p-4 bg-background-50 border border-outline-100 rounded-xl items-center overflow-hidden">
                    {data?.monthlyVisits && data.monthlyVisits.length > 0 ? (
                        <LineChart
                            data={data.monthlyVisits.map((item) => ({
                                value: item.count,
                                label: item.month,
                            }))}
                            areaChart
                            yAxisOffset={0}
                            initialSpacing={20}
                            spacing={50}
                            color={primary['500']}
                            thickness={3}
                            startFillColor={primary['500']}
                            endFillColor={primary['500']}
                            startOpacity={0.4}
                            endOpacity={0.1}
                            noOfSections={4}
                            yAxisThickness={0}
                            xAxisThickness={0}
                            yAxisTextStyle={{ color: typography['500'], fontSize: 10 }}
                            xAxisLabelTextStyle={{ color: typography['700'], fontSize: 10 }}
                            hideRules
                            hideDataPoints
                            width={300}
                            height={200}
                            isAnimated
                        />
                    ) : (
                        <Text className="text-typography-500 italic">No trend data available.</Text>
                    )}
                </Card>
            </VStack>

        </ScrollView>
    );
};

const SummaryCard = ({
    title,
    value,
    icon,
    iconClassName,
    cardClassName,
}: {
    title: string;
    value: number;
    icon: any;
    iconClassName?: string;
    cardClassName?: string;
}) => (
    <Card className={`flex-1 p-4 rounded-xl shadow-sm border ${cardClassName}`}>
        <View className="flex-row items-center justify-between mb-2">
            <View className={`p-2 rounded-full bg-white/50`}>
                <Icon as={icon} size="md" className={iconClassName} />
            </View>
        </View>
        <Heading size="xl" className="text-typography-900">{value}</Heading>
        <Text className="text-xs font-medium text-typography-600 uppercase tracking-wider">{title}</Text>
    </Card>
)

export default LandmarkAnalyticsScreen;
