import { EllipsisVertical, Eye, Info, MapPin, Play, Ruler, Trash2 } from 'lucide-react-native';
import React, { useRef } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Progress, ProgressFilledTrack } from '@/components/ui/progress';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

import { ItineraryWithStops } from '@/src/model/itinerary.types';
import { formatDate } from '@/src/utils/format/date';
import { formatDistance } from '@/src/utils/format/distance';

interface ItineraryItemProps {
    itinerary: ItineraryWithStops;
    onPress: (id: number) => void;
    onInfoPress: (id: number) => void;
    onDeletePress?: (id: number) => void;
}

const calculateProgress = (itinerary: ItineraryWithStops) => {
    if (!itinerary.stops?.length) return 0;
    const completed = itinerary.stops.filter(stop => !!stop.visited_at).length;
    return (completed / itinerary.stops.length) * 100;
};

export const ItineraryItem = ({ itinerary, onPress, onInfoPress, onDeletePress }: ItineraryItemProps) => {
    const swipeableRef = useRef<Swipeable>(null);
    const progress = calculateProgress(itinerary);
    const isComplete = progress === 100;

    const renderRightActions = (
        _progress: Animated.AnimatedInterpolation<number>,
        dragX: Animated.AnimatedInterpolation<number>
    ) => {
        const trans = dragX.interpolate({
            inputRange: [-128, 0],
            outputRange: [0, 128],
        });

        return (
            <Animated.View style={{ transform: [{ translateX: trans }], flexDirection: 'row', width: 140, paddingLeft: 12 }}>
                <View className="flex-1 flex-row gap-2 h-full items-center p-3">
                    <Button
                        onPress={() => {
                            swipeableRef.current?.close();
                            onInfoPress(itinerary.id);
                        }}
                        className='rounded-full'
                        size="lg"
                        action='secondary'
                    >
                        <ButtonIcon as={Info} size="md" />
                    </Button>
                    <Button
                        onPress={() => {
                            swipeableRef.current?.close();
                            if (onDeletePress) onDeletePress(itinerary.id);
                        }}
                        className='rounded-full'
                        size="lg"
                        action='negative'
                    >
                        <ButtonIcon as={Trash2} size="md" />
                    </Button>
                </View>
            </Animated.View>
        );
    };

    return (
        <Swipeable
            ref={swipeableRef}
            renderRightActions={renderRightActions}
            rightThreshold={40}
            overshootRight={false}
            containerStyle={{ overflow: 'visible' }}
        >
            <Pressable onPress={() => onPress(itinerary.id)}>
                <View className="p-5 rounded-3xl bg-background-100 border border-outline-200 shadow-md">
                    <HStack className="justify-between items-start mb-4">
                        <VStack className="flex-1 pr-4">
                            <Text size="sm" className="uppercase font-bold text-typography-500 tracking-wider mb-1">
                                {formatDate(itinerary.created_at)}
                            </Text>
                            <Heading size="lg" className="text-typography-900 leading-tight mb-2">
                                {itinerary.name}
                            </Heading>
                            <HStack className="items-center gap-3">
                                <HStack className="items-center gap-1.5">
                                    <Icon as={MapPin} size="sm" />
                                    <Text size="sm" className="font-bold text-typography-600">
                                        {itinerary.stops?.length || 0} Stops
                                    </Text>
                                </HStack>
                                <Box className="w-1 h-1 rounded-full bg-typography-300" />
                                <HStack className="items-center gap-1.5">
                                    <Icon as={Ruler} size="sm" />
                                    <Text size="sm" className="font-bold text-typography-600">
                                        {formatDistance(itinerary.distance)}
                                    </Text>
                                </HStack>
                            </HStack>
                        </VStack>
                        <Pressable hitSlop={32} onPress={() => swipeableRef.current?.openRight()}>
                            <Icon as={EllipsisVertical} className="text-typography-400 mt-1" />
                        </Pressable>
                    </HStack>
                    {progress > 0 && (
                        <VStack className="gap-2 mb-6">
                            <HStack className="justify-between items-end">
                                <Text size="sm" className="text-typography-500 font-medium">Progress</Text>
                                <Text size="sm" className="text-typography-900 font-bold">{Math.round(progress)}%</Text>
                            </HStack>

                            <Progress value={progress} className="w-full h-2">
                                <ProgressFilledTrack className="h-2 " />
                            </Progress>
                        </VStack>
                    )}

                    <Button
                        size="lg"
                        onPress={() => onPress(itinerary.id)}
                        className={`rounded-2xl shadow-soft-2 ${isComplete ? 'bg-success-600' : 'bg-primary-600'}`}
                    >
                        <ButtonIcon as={progress === 0 ? Play : (isComplete ? Eye : Play)} className="mr-2" />
                        <ButtonText className="font-bold">
                            {progress === 0 ? 'Start' : (isComplete ? 'View' : 'Continue')}
                        </ButtonText>
                    </Button>
                </View>
            </Pressable>
        </Swipeable>
    );
};
