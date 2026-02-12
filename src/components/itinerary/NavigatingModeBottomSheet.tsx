import {
    Bike,
    Car,
    CheckCircle,
    Clock,
    Copyright,
    Footprints,
    Navigation2,
    Settings,
    StopCircle,
    Volume2
} from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, Switch } from 'react-native';

import {
    Actionsheet,
    ActionsheetBackdrop,
    ActionsheetContent,
    ActionsheetDragIndicator,
    ActionsheetDragIndicatorWrapper
} from '@/components/ui/actionsheet';

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
import { formatDistance } from '@/src/utils/format/distance';
import { formatDuration } from '@/src/utils/format/duration';
import { getETATime } from '@/src/utils/navigation/calculateETA';
import { MapboxRoute } from '@/src/utils/navigation/fetchDirections';
import { getStepIcon } from '@/src/utils/ui/getStepIcon';

interface NavigatingModeBottomSheetProps {
    navigationRoute: MapboxRoute[];
    mode: Mode;
    nextUnvisitedStop: StopWithLandmark | null;
    exitNavigationMode: () => void;
    navigationProfile: 'driving' | 'walking' | 'cycling';
    setNavigationProfile: (profile: 'driving' | 'walking' | 'cycling') => void;
    avoidTolls: boolean;
    setAvoidTolls: (avoid: boolean) => void;
    onArrive: () => void;
    currentStepIndex: number;
    currentStepRemainingDistance: number;
    isVoiceEnabled: boolean;
    setVoiceEnabled: (enabled: boolean) => void;
}

export function NavigatingModeBottomSheet({
    mode,
    navigationRoute,
    nextUnvisitedStop,
    exitNavigationMode,
    navigationProfile,
    setNavigationProfile,
    avoidTolls,
    setAvoidTolls,
    onArrive,
    currentStepIndex,
    currentStepRemainingDistance,
    isVoiceEnabled,
    setVoiceEnabled,
}: NavigatingModeBottomSheetProps) {
    const [showActionsheet, setShowActionsheet] = useState(false);

    if (mode !== Mode.Navigating) return null;

    const currentLeg = navigationRoute[0]?.legs[0];
    const currentStep = currentLeg?.steps[currentStepIndex];
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

                {/* Navigation Options - Profile & Settings */}
                <HStack className="justify-between items-center bg-background-50 p-3 rounded-2xl border border-outline-100">
                    <HStack space="md" className="items-center">
                        <Box className="bg-primary-500 p-2 rounded-xl">
                            <Icon
                                as={navigationProfile === 'driving' ? Car : navigationProfile === 'walking' ? Footprints : Bike}
                                className="text-typography-0"
                            />
                        </Box>
                        <VStack>
                            <Text size="sm" className="font-bold text-typography-900 capitalize">
                                {navigationProfile} Mode
                            </Text>
                            {navigationProfile === 'driving' && avoidTolls && (
                                <Text size="xs" className="text-typography-500">
                                    Avoiding Tolls
                                </Text>
                            )}
                        </VStack>
                    </HStack>

                    <Button
                        size="sm"
                        variant="outline"
                        action="secondary"
                        onPress={() => setShowActionsheet(true)}
                        className="rounded-xl border-outline-200"
                    >
                        <ButtonIcon as={Settings} className="text-typography-500 mr-2" />
                        <ButtonText className="text-typography-600">Options</ButtonText>
                    </Button>
                </HStack>

                <Actionsheet isOpen={showActionsheet} onClose={() => setShowActionsheet(false)}>
                    <ActionsheetBackdrop />
                    <ActionsheetContent>
                        <ActionsheetDragIndicatorWrapper>
                            <ActionsheetDragIndicator />
                        </ActionsheetDragIndicatorWrapper>

                        <VStack className="w-full pb-6 px-4" space="md">
                            <Text size="lg" className="font-bold text-typography-900 mb-2">
                                Navigation Settings
                            </Text>

                            <VStack space="sm">
                                <Text size="sm" className="font-medium text-typography-500 uppercase tracking-wider">
                                    Travel Mode
                                </Text>
                                <HStack space="sm" className="flex-wrap">
                                    {([{
                                        mode: 'driving',
                                        icon: Car,
                                    },
                                    {
                                        mode: 'walking',
                                        icon: Footprints,
                                    },
                                    {
                                        mode: 'cycling',
                                        icon: Bike,
                                    }
                                    ] as const).map((p) => (
                                        <Button
                                            key={p.mode}
                                            size="sm"
                                            variant={navigationProfile === p.mode ? 'solid' : 'outline'}
                                            onPress={() => {
                                                setShowActionsheet(false);
                                                // Delays the change of profile to allow the actionsheet to close first
                                                setTimeout(() => {
                                                    setNavigationProfile(p.mode);
                                                }, 250);
                                            }}
                                            className={`rounded-xl px-5 py-2 justify-center gap-2 ${navigationProfile === p.mode ? 'bg-primary-500 border-primary-500' : 'border-outline-200'} `}
                                        >
                                            <ButtonIcon
                                                as={p.icon}
                                                className={`${navigationProfile === p.mode ? 'text-typography-0' : 'text-typography-500'} `}
                                            />
                                            <ButtonText className={`capitalize ${navigationProfile === p.mode ? 'text-typography-0' : 'text-typography-700 '} `}>
                                                {p.mode}
                                            </ButtonText>
                                        </Button>
                                    ))}
                                </HStack>
                            </VStack>

                            {navigationProfile === 'driving' && (
                                <>
                                    <Divider className="my-2" />
                                    <HStack className="justify-between items-center">
                                        <HStack space="xs" className="items-center">
                                            <Icon as={Copyright} size="sm" className="text-typography-500" />
                                            <Text size="md" className="font-medium text-typography-900">
                                                Avoid Tolls
                                            </Text>
                                        </HStack>
                                        <Switch
                                            value={avoidTolls}
                                            onValueChange={(val) => setAvoidTolls(val)}
                                            trackColor={{ false: '#e2e8f0', true: '#3b82f6' }}
                                            thumbColor={'#fff'}
                                        />
                                    </HStack>
                                </>
                            )}

                            <Divider className="my-2" />
                            <HStack className="justify-between items-center">
                                <HStack space="xs" className="items-center">
                                    <Icon as={Volume2} size="sm" className="text-typography-500" />
                                    <Text size="md" className="font-medium text-typography-900">
                                        Voice Navigation
                                    </Text>
                                </HStack>
                                <Switch
                                    value={isVoiceEnabled}
                                    onValueChange={(val) => setVoiceEnabled(val)}
                                    trackColor={{ false: '#e2e8f0', true: '#3b82f6' }}
                                    thumbColor={'#fff'}
                                />
                            </HStack>
                        </VStack>
                    </ActionsheetContent>
                </Actionsheet>

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
                                {formatDistance(currentStepRemainingDistance)}
                            </Text>
                            <Heading size='lg' className="leading-tight">
                                {currentStep?.maneuver.instruction}
                            </Heading>
                        </VStack>
                    </HStack>
                </Box>

                <VStack className="items-center justify-between" space="sm">
                    <HStack space="sm" className='items-center'>
                        <Icon as={CheckCircle} size="sm" className="text-success-500" />
                        <Text size="sm" className="text-typography-500 font-medium">
                            Target: <Text size="sm" className="font-bold text-typography-900">{nextUnvisitedStop?.landmark.name}</Text>
                        </Text>
                    </HStack>

                    <Button size='sm' onPress={onArrive}>
                        <ButtonText>Mark as Arrived</ButtonText>
                        <ButtonIcon as={CheckCircle} />
                    </Button>
                </VStack>
            </VStack>

            <Divider className="mx-4" />

            {/* Upcoming Steps List - Scrollable */}
            <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-4 mt-2">
                <Text size="xs" className="px-2 mb-3 uppercase font-bold text-typography-400">Upcoming Steps</Text>
                <VStack space='sm' className="pb-6">
                    {remainingSteps.slice(currentStepIndex).map((step, i) => (
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
