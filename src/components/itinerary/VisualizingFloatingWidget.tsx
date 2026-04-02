import React from 'react';
import { Box } from '@/components/ui/box';
import { Button, ButtonIcon } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Divider } from '@/components/ui/divider';
import { ChevronLeft, ChevronRight, Car, Footprints, Bike, X } from 'lucide-react-native';
import { formatDistance } from '@/src/utils/format/distance';
import { formatDuration } from '@/src/utils/format/time';

interface VisualizingFloatingWidgetProps {
    isVisible: boolean;
    currentLegIndex: number;
    totalLegs: number;
    startName: string;
    endName: string;
    duration: number;
    distance: number;
    profile: 'driving' | 'walking' | 'cycling';
    onNext: () => void;
    onPrevious: () => void;
    onChangeProfile: (profile: 'driving' | 'walking' | 'cycling') => void;
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
    onNext,
    onPrevious,
    onChangeProfile,
    onCancel,
}: VisualizingFloatingWidgetProps) {
    if (!isVisible) return null;

    return (
        <Box className='absolute bottom-6 left-4 right-4 bg-background-0 rounded-3xl shadow-xl border border-outline-100 p-4 z-50'>
            <VStack space='md'>
                <HStack className='justify-between items-start'>
                    <VStack className='flex-1 pr-2'>
                        <Text size='sm' className='text-primary-500 font-semibold uppercase tracking-wider mb-1'>
                            Step {currentLegIndex + 1} of {totalLegs}
                        </Text>
                        <Text size='md' className='text-typography-900 font-medium' numberOfLines={1}>
                            {startName}
                        </Text>
                        <Text size='sm' className='text-typography-500' numberOfLines={1}>
                            to {endName}
                        </Text>
                    </VStack>
                    <Button variant='link' action='secondary' size='sm' onPress={onCancel} className='p-1'>
                        <ButtonIcon as={X} size='xl' className='text-typography-500'/>
                    </Button>
                </HStack>

                <HStack space='lg' className='items-center'>
                    <VStack>
                        <Text size='xs' className='text-typography-500'>Duration</Text>
                        <Text size='sm' className='font-bold text-typography-900'>
                            {formatDuration(Math.round(duration / 60))}
                        </Text>
                    </VStack>
                    <Divider orientation="vertical" className='bg-outline-200 h-8'/>
                    <VStack>
                        <Text size='xs' className='text-typography-500'>Distance</Text>
                        <Text size='sm' className='font-bold text-typography-900'>
                            {formatDistance(distance)}
                        </Text>
                    </VStack>
                </HStack>

                <Divider className='bg-outline-100' />

                <HStack className='justify-between items-center w-full'>
                    {/* Profile Switchers */}
                    <HStack space='xs'>
                        <Button 
                            variant={profile === 'driving' ? 'solid' : 'outline'} 
                            action='primary' 
                            size='sm' 
                            className='rounded-xl p-2'
                            onPress={() => onChangeProfile('driving')}
                        >
                            <ButtonIcon as={Car} size='sm' className={profile === 'driving' ? 'text-typography-0' : 'text-primary-500'} />
                        </Button>
                        <Button 
                            variant={profile === 'walking' ? 'solid' : 'outline'} 
                            action='primary' 
                            size='sm' 
                            className='rounded-xl p-2'
                            onPress={() => onChangeProfile('walking')}
                        >
                            <ButtonIcon as={Footprints} size='sm' className={profile === 'walking' ? 'text-typography-0' : 'text-primary-500'} />
                        </Button>
                        <Button 
                            variant={profile === 'cycling' ? 'solid' : 'outline'} 
                            action='primary' 
                            size='sm' 
                            className='rounded-xl p-2'
                            onPress={() => onChangeProfile('cycling')}
                        >
                            <ButtonIcon as={Bike} size='sm' className={profile === 'cycling' ? 'text-typography-0' : 'text-primary-500'} />
                        </Button>
                    </HStack>

                    {/* Navigation */}
                    <HStack space='md'>
                        <Button 
                            action='secondary' 
                            size='sm' 
                            className='rounded-xl'
                            isDisabled={currentLegIndex === 0}
                            onPress={onPrevious}
                        >
                            <ButtonIcon as={ChevronLeft} size='xl'/>
                        </Button>
                        <Button 
                            action='secondary' 
                            size='sm' 
                            className='rounded-xl'
                            isDisabled={currentLegIndex >= totalLegs - 1}
                            onPress={onNext}
                        >
                            <ButtonIcon as={ChevronRight} size='xl'/>
                        </Button>
                    </HStack>
                </HStack>
            </VStack>
        </Box>
    );
}
