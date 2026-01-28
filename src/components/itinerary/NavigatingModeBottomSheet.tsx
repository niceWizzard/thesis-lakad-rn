import {
    CheckCircle,
    Clock,
    Navigation2,
    StopCircle
} from 'lucide-react-native';
import React from 'react';
import { ScrollView } from 'react-native';

import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

import { Mode } from '@/src/hooks/itinerary/useNavigationState';
import { StopWithLandmark } from '@/src/model/stops.types';
import { formatDuration } from '@/src/utils/format/duration';
import { getETATime } from '@/src/utils/navigation/calculateETA';
import { MapboxRoute } from '@/src/utils/navigation/fetchDirections';
import { getStepIcon } from '@/src/utils/ui/getStepIcon';

interface NavigatingModeBottomSheetProps {
    navigationRoute: MapboxRoute[];
    mode: Mode;
    nextUnvisitedStop: StopWithLandmark | null;
    exitNavigationMode: () => void;
}

export function NavigatingModeBottomSheet({
    mode,
    navigationRoute,
    nextUnvisitedStop,
    exitNavigationMode,
}: NavigatingModeBottomSheetProps) {
    if (mode !== Mode.Navigating) return null;

    const currentLeg = navigationRoute[0]?.legs[0];
    const currentStep = currentLeg?.steps[0];
    const remainingSteps = currentLeg?.steps.slice(1) || [];

    // Calculate ETA and duration
    const totalDuration = navigationRoute[0]?.duration || 0;
    const eta = getETATime(totalDuration);
    const duration = formatDuration(totalDuration);

    return (
        <VStack className='h-full bg-background-0'>
            {/* Compact Header - Always Visible */}
            <VStack space="md" className="px-4 pt-3 pb-4">
                {/* Drag Indicator & Exit Button Row */}
                <Box className='self-center w-12 h-1 bg-outline-300 rounded-full' />
                <Button
                    variant='link'
                    onPress={exitNavigationMode}
                    className="p-0"
                    action='negative'
                >
                    <ButtonIcon as={StopCircle} size="xl" />
                    <ButtonText>Stop</ButtonText>
                </Button>
                {/* ETA and Duration Header */}
                <HStack className="p-4 bg-primary-50 rounded-2xl border border-primary-200" space="md">
                    <VStack className="flex-1">
                        <Text size="xs" className="text-primary-600 font-semibold uppercase tracking-wide">
                            Estimated Arrival
                        </Text>
                        <Text size="xl" className="font-bold text-primary-700">
                            {eta}
                        </Text>
                    </VStack>
                    <Divider orientation="vertical" className="h-auto" />
                    <VStack className="flex-1 items-end">
                        <Text size="xs" className="text-primary-600 font-semibold uppercase tracking-wide">
                            Duration
                        </Text>
                        <HStack space="xs" className="items-center">
                            <Icon as={Clock} size="sm" className="text-primary-700" />
                            <Text size="xl" className="font-bold text-primary-700">
                                {duration}
                            </Text>
                        </HStack>
                    </VStack>
                </HStack>

                {/* Primary Instruction Card */}
                <Box className="p-5 bg-background-100 rounded-3xl shadow-xl">
                    <HStack space="lg" className="items-center">
                        <Box className="bg-primary-500 p-4 rounded-2xl">
                            <Icon
                                as={Navigation2}
                                size="xl"
                                style={{ transform: [{ rotate: '45deg' }] }}
                            />
                        </Box>
                        <VStack className="flex-1">
                            <Text size="sm" className="text-primary-400 font-bold uppercase tracking-wider">
                                {navigationRoute[0]?.distance > 1000
                                    ? `${(navigationRoute[0]?.distance / 1000).toFixed(1)} km`
                                    : `${navigationRoute[0]?.distance.toFixed(0)} m`}
                            </Text>
                            <Heading size='lg' className="leading-tight">
                                {currentStep?.maneuver.instruction}
                            </Heading>
                        </VStack>
                    </HStack>
                </Box>

                {/* Destination Target */}
                <HStack className="items-center" space="sm">
                    <Icon as={CheckCircle} size="sm" className="text-success-500" />
                    <Text size="sm" className="text-typography-500 font-medium">
                        Target: <Text size="sm" className="font-bold text-typography-900">{nextUnvisitedStop?.landmark.name}</Text>
                    </Text>
                </HStack>
            </VStack>

            <Divider className="mx-4" />

            {/* Upcoming Steps List - Scrollable */}
            <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-4 mt-2">
                <Text size="xs" className="px-2 mb-3 uppercase font-bold text-typography-400">Upcoming Steps</Text>
                <VStack space='sm' className="pb-6">
                    {remainingSteps.map((step, i) => (
                        <HStack key={i} space="md" className='bg-background-50 p-4 rounded-2xl items-center border border-outline-50'>
                            <Box className="bg-background-300 p-2 rounded-xl shadow-sm border border-outline-100">
                                <Icon as={getStepIcon(step.maneuver.instruction)} size="xs" className="text-typography-400" />
                            </Box>
                            <VStack className="flex-1">
                                <Text size='md' className="text-typography-800 font-medium">{step.maneuver.instruction}</Text>
                                <Text size='xs' className="text-typography-400">{step.distance.toFixed(0)} m</Text>
                            </VStack>
                        </HStack>
                    ))}
                </VStack>
            </ScrollView>
        </VStack>
    );
}
