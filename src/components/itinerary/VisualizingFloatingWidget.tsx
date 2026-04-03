import { Box } from '@/components/ui/box';
import { Button, ButtonIcon } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { formatDistance } from '@/src/utils/format/distance';
import { formatDuration } from '@/src/utils/format/time';
import { Bike, Car, ChevronLeft, ChevronRight, Footprints, Settings, X, Route } from 'lucide-react-native';
import React, { useState } from 'react';
import { Actionsheet, ActionsheetBackdrop, ActionsheetContent, ActionsheetDragIndicator, ActionsheetDragIndicatorWrapper } from '@/components/ui/actionsheet';
import { Switch } from '@/components/ui/switch';

interface VisualizingFloatingWidgetProps {
    isVisible: boolean;
    currentLegIndex: number;
    totalLegs: number;
    startName: string;
    endName: string;
    duration: number;
    distance: number;
    profile: 'driving' | 'walking' | 'cycling';
    exclude: string[];
    onNext: () => void;
    onPrevious: () => void;
    onChangeProfile: (profile: 'driving' | 'walking' | 'cycling') => void;
    onChangeExclude: (exclude: string[]) => void;
    onCancel: () => void;
}

export function VisualizingFloatingWidget({
    isVisible,
    currentLegIndex,
    totalLegs,
    startName,
    endName,
    duration,
    distance,
    profile,
    exclude,
    onNext,
    onPrevious,
    onChangeProfile,
    onChangeExclude,
    onCancel,
}: VisualizingFloatingWidgetProps) {
    const [showSettings, setShowSettings] = useState(false);

    if (!isVisible) return null;

    const toggleExclude = (item: string) => {
        if (exclude.includes(item)) {
            onChangeExclude(exclude.filter(e => e !== item));
        } else {
            onChangeExclude([...exclude, item]);
        }
    };

    return (
        <Box className='absolute bottom-6 left-4 right-4 bg-background-0 rounded-3xl shadow-xl border border-outline-100 p-4 z-50'>
            <VStack space='md'>
                <HStack className='justify-between items-start'>
                    <VStack className='flex-1 pr-2'>
                        <Text className='text-primary-500 font-semibold uppercase tracking-wider mb-1'>
                            Step {currentLegIndex + 1} of {totalLegs}
                        </Text>
                        <Text size='md' className='text-typography-900 font-medium' numberOfLines={1}>
                            {startName}
                        </Text>
                        <Text className='text-typography-500' numberOfLines={1}>
                            to {endName}
                        </Text>
                    </VStack>
                    <Button variant='link' action='secondary' onPress={onCancel} className='p-1'>
                        <ButtonIcon as={X} size='xl' className='text-typography-500' />
                    </Button>
                </HStack>

                <HStack space='lg' className='items-center'>
                    <VStack>
                        <Text className='text-typography-500'>Duration</Text>
                        <Text className='font-bold text-typography-900'>
                            {formatDuration(Math.round(duration / 60))}
                        </Text>
                    </VStack>
                    <Divider orientation="vertical" className='bg-outline-200 h-8' />
                    <VStack>
                        <Text className='text-typography-500'>Distance</Text>
                        <Text className='font-bold text-typography-900'>
                            {formatDistance(distance)}
                        </Text>
                    </VStack>
                </HStack>

                <Divider className='bg-outline-100' />

                <HStack className='justify-between items-center w-full'>
                    {/* Settings Trigger */}
                    <HStack space='sm'>
                        <Button
                            variant='outline'
                            action='primary'
                            className='rounded-xl p-2'
                            onPress={() => setShowSettings(true)}
                        >
                            <ButtonIcon as={Settings} className='text-primary-500' />
                        </Button>
                    </HStack>

                    {/* Navigation */}
                    <HStack space='md'>
                        <Button
                            action='secondary'
                            className='rounded-xl'
                            isDisabled={currentLegIndex === 0}
                            onPress={onPrevious}
                        >
                            <ButtonIcon as={ChevronLeft} size='xl' />
                        </Button>
                        <Button
                            action='secondary'
                            className='rounded-xl'
                            isDisabled={currentLegIndex >= totalLegs - 1}
                            onPress={onNext}
                        >
                            <ButtonIcon as={ChevronRight} size='xl' />
                        </Button>
                    </HStack>
                </HStack>
            </VStack>

            <Actionsheet isOpen={showSettings} onClose={() => setShowSettings(false)}>
                <ActionsheetBackdrop />
                <ActionsheetContent>
                    <ActionsheetDragIndicatorWrapper>
                        <ActionsheetDragIndicator />
                    </ActionsheetDragIndicatorWrapper>
                    <VStack space='xl' className='w-full px-4 py-6'>
                        <VStack space='md'>
                            <Text size='lg' className='font-bold text-typography-900'>Transportation Mode</Text>
                            <HStack space='sm'>
                                <Button
                                    variant={profile === 'driving' ? 'solid' : 'outline'}
                                    action='primary'
                                    className='flex-1 rounded-xl'
                                    onPress={() => onChangeProfile('driving')}
                                >
                                    <ButtonIcon as={Car} className={profile === 'driving' ? 'text-typography-0' : 'text-primary-500'} />
                                </Button>
                                <Button
                                    variant={profile === 'walking' ? 'solid' : 'outline'}
                                    action='primary'
                                    className='flex-1 rounded-xl'
                                    onPress={() => onChangeProfile('walking')}
                                >
                                    <ButtonIcon as={Footprints} className={profile === 'walking' ? 'text-typography-0' : 'text-primary-500'} />
                                </Button>
                                <Button
                                    variant={profile === 'cycling' ? 'solid' : 'outline'}
                                    action='primary'
                                    className='flex-1 rounded-xl'
                                    onPress={() => onChangeProfile('cycling')}
                                >
                                    <ButtonIcon as={Bike} className={profile === 'cycling' ? 'text-typography-0' : 'text-primary-500'} />
                                </Button>
                            </HStack>
                        </VStack>

                        <Divider className='bg-outline-100' />

                        <VStack space='md' className='min-h-[180px]'>
                            <Text size='lg' className='font-bold text-typography-900'>Route Options</Text>
                            {profile === 'driving' && (
                                <HStack className='justify-between items-center py-2'>
                                    <HStack space='md' className='items-center'>
                                        <Route size={20} className='text-typography-500' />
                                        <Text className='text-typography-700'>Avoid Tolls</Text>
                                    </HStack>
                                    <Switch
                                        value={exclude.includes('toll')}
                                        onValueChange={() => toggleExclude('toll')}
                                    />
                                </HStack>
                            )}
                            <HStack className='justify-between items-center py-2'>
                                <HStack space='md' className='items-center'>
                                    <Route size={20} className='text-typography-500' />
                                    <Text className='text-typography-700'>Avoid Ferries</Text>
                                </HStack>
                                <Switch
                                    value={exclude.includes('ferry')}
                                    onValueChange={() => toggleExclude('ferry')}
                                />
                            </HStack>
                            {profile === 'driving' && (
                                <HStack className='justify-between items-center py-2'>
                                    <HStack space='md' className='items-center'>
                                        <Route size={20} className='text-typography-500' />
                                        <Text className='text-typography-700'>Avoid Highways</Text>
                                    </HStack>
                                    <Switch
                                        value={exclude.includes('motorway')}
                                        onValueChange={() => toggleExclude('motorway')}
                                    />
                                </HStack>
                            )}
                        </VStack>
                    </VStack>
                    <Box style={{ height: 40 }} />
                </ActionsheetContent>
            </Actionsheet>
        </Box>
    );
}
