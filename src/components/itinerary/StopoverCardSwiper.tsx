import { Button, ButtonIcon } from '@/components/ui/button';
import { Center } from '@/components/ui/center';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useToastNotification } from '@/src/hooks/useToastNotification';
import { ItineraryWithStops } from '@/src/model/itinerary.types';
import { supabase } from '@/src/utils/supabase';
import { useFocusEffect } from 'expo-router';
import { CircleCheck, CircleX, Minimize2 } from 'lucide-react-native';
import React, { ForwardedRef, forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { BackHandler, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import StopOverCard from './StopOverCard';

// Interface for the exposed methods
export interface SwipeableCardRef {
    swipeLeft: () => void;
    swipeRight: () => void;
}

interface SwipeableCardProps {
    stop: ItineraryWithStops['stops'][number];
    onSwipeLeftConfirmed: () => void;
    onSwipeRightConfirmed: () => void;
}

const SwipeableCard = forwardRef(({ stop, onSwipeLeftConfirmed, onSwipeRightConfirmed }: SwipeableCardProps, ref: ForwardedRef<SwipeableCardRef>) => {
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const TRANSLATION_X_THRESHOLD = SCREEN_WIDTH * 0.3;

    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    useImperativeHandle(ref, () => ({
        swipeLeft: () => {
            translateX.value = withTiming(-SCREEN_WIDTH, { duration: 200 }, (finished) => {
                if (finished) {
                    scheduleOnRN(onSwipeLeftConfirmed);
                }
            });
        },
        swipeRight: () => {
            translateX.value = withTiming(SCREEN_WIDTH, { duration: 200 }, (finished) => {
                if (finished) {
                    scheduleOnRN(onSwipeRightConfirmed);
                }
            });
        }
    }));

    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            translateX.value = event.translationX;
            translateY.value = event.translationY;
        })
        .onEnd((event) => {
            if (Math.abs(event.translationX) > TRANSLATION_X_THRESHOLD) {
                const isSwipingRight = event.translationX > 0;
                translateX.value = withTiming(
                    isSwipingRight ? SCREEN_WIDTH : -SCREEN_WIDTH,
                    { duration: 200 },
                    (finished) => {
                        if (finished) {
                            if (isSwipingRight) {
                                scheduleOnRN(onSwipeRightConfirmed);
                            } else {
                                scheduleOnRN(onSwipeLeftConfirmed);
                            }
                        }
                    }
                );
            } else {
                translateX.value = withTiming(0);
                translateY.value = withTiming(0);
            }
        });

    const animatedStyle = useAnimatedStyle(() => {
        const rotate = `${(translateX.value / SCREEN_WIDTH) * 15}deg`;
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { rotate: rotate }
            ]
        };
    });

    const leftHintStyle = useAnimatedStyle(() => {
        return {
            opacity: translateX.value > 0 ? translateX.value / (SCREEN_WIDTH * 0.3) : 0,
        };
    });

    const rightHintStyle = useAnimatedStyle(() => {
        return {
            opacity: translateX.value < 0 ? -translateX.value / (SCREEN_WIDTH * 0.3) : 0,
        };
    });

    return (
        <GestureDetector gesture={panGesture}>
            <Animated.View style={[animatedStyle, { flex: 1, width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }]}>
                <View className='relative'>
                    <StopOverCard stop={stop} />

                    {/* Keep Hint (Swipe Right) */}
                    <Animated.View style={[leftHintStyle, { position: 'absolute', top: 40, left: 40, transform: [{ rotate: '-30deg' }] }]}>
                        <View className='border-4 border-green-500 rounded-lg p-2 bg-white/80'>
                            <Text className='text-green-500 font-bold text-4xl uppercase tracking-widest'>Keep</Text>
                        </View>
                    </Animated.View>

                    {/* Remove Hint (Swipe Left) */}
                    <Animated.View style={[rightHintStyle, { position: 'absolute', top: 40, right: 40, transform: [{ rotate: '30deg' }] }]}>
                        <View className='border-4 border-red-500 rounded-lg p-2 bg-white/80'>
                            <Text className='text-red-500 font-bold text-4xl uppercase tracking-widest'>Remove</Text>
                        </View>
                    </Animated.View>
                </View>
            </Animated.View>
        </GestureDetector>
    );
});

SwipeableCard.displayName = 'SwipeableCard';

const StopoverCardSwiper = ({
    onClose,
    refetch,
    showToast,
    stops,
}: {
    onClose: () => void,
    stops: ItineraryWithStops['stops'][number][],
    refetch: () => Promise<any>,
    showToast: ReturnType<typeof useToastNotification>['showToast'],
}) => {
    const { height: SCREEN_HEIGHT } = useWindowDimensions();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [haveReachedEnd, setHaveReachedEnd] = useState(false);
    const cardRef = useRef<SwipeableCardRef>(null);

    // Animation values
    const containerTranslateY = useSharedValue(SCREEN_HEIGHT);
    const backgroundOpacity = useSharedValue(0);

    useEffect(() => {
        // Animate in
        containerTranslateY.value = withTiming(0, { duration: 300 });
        backgroundOpacity.value = withTiming(1, { duration: 300 });
    }, [SCREEN_HEIGHT, backgroundOpacity, containerTranslateY]);

    const tryIncrementIndex = () => {
        if (currentIndex < stops.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setHaveReachedEnd(true);
        }
    };

    const handleClose = useCallback(() => {
        // Animate out
        backgroundOpacity.value = withTiming(0, { duration: 300 });
        containerTranslateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 }, (finished) => {
            if (finished) {
                runOnJS(onClose)();
            }
        });
    }, [onClose, SCREEN_HEIGHT, backgroundOpacity, containerTranslateY]);

    useFocusEffect(useCallback(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            handleClose();
            return true;
        });
        return () => backHandler.remove();
    }, [handleClose]));

    useEffect(() => {
        if (haveReachedEnd) {
            handleClose();
        }
    }, [haveReachedEnd, handleClose]);

    const currentStop = stops[currentIndex];

    const onSwipeLeftAction = async () => {
        tryIncrementIndex();

        try {
            const { error } = await supabase.from('stops').delete().eq('id', currentStop.id);
            if (error) throw error;
            await refetch();
        } catch (err: any) {
            showToast({
                title: "Error removing stop.",
                description: err.message ?? "Could not remove stop.",
                action: 'error'
            });
        }
    };

    const onSwipeRightAction = () => {
        tryIncrementIndex();
    };

    const handleLeftButtonPress = () => {
        cardRef.current?.swipeLeft();
    };

    const handleRightButtonPress = () => {
        cardRef.current?.swipeRight();
    };

    const containerStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: containerTranslateY.value }]
    }));

    const backgroundStyle = useAnimatedStyle(() => ({
        opacity: backgroundOpacity.value
    }));

    if (haveReachedEnd) {
        return null;
    }

    return (
        <View className='flex-1 w-full h-full'>
            <Animated.View style={[{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)' }, backgroundStyle]} />

            <VStack className='flex-1 w-full h-full p-safe'>
                <Animated.View style={[{ flex: 1, width: '100%', height: '100%' }, containerStyle]}>

                    <View className='flex-1 w-full h-full relative'>
                        {/* Background Layer (Next Card) */}
                        <View
                            className='absolute w-full h-full'
                        >
                            <Center className='flex-1 w-full h-full'>
                                {currentIndex < stops.length - 1 ? (
                                    <StopOverCard stop={stops[currentIndex + 1]} />
                                ) : (
                                    <VStack className='p-4 size-64 rounded-lg bg-background-0 justify-center items-center' >
                                        <Text>All stops swiped</Text>
                                    </VStack>
                                )}
                            </Center>
                        </View>

                        {/* Foreground Layer (Current Card) */}
                        <View
                            className='flex-1 w-full h-full'
                        >
                            <SwipeableCard
                                key={currentStop.id}
                                ref={cardRef}
                                stop={currentStop}
                                onSwipeLeftConfirmed={onSwipeLeftAction}
                                onSwipeRightConfirmed={onSwipeRightAction}
                            />
                        </View>
                    </View>

                    <View
                        className='w-full pt-4 pb-2 items-center gap-1'
                    >
                        <Text className='text-white font-bold'>Swipe left or right</Text>
                        <Text className='text-white text-sm opacity-80'>
                            {currentIndex + 1} / {stops.length}
                        </Text>
                    </View>

                    <View>
                        <HStack className='p-4 gap-4 justify-between'>
                            <Button onPress={handleLeftButtonPress}
                                action='negative'
                            >
                                <ButtonIcon as={CircleX} />
                            </Button>
                            <Button onPress={handleClose}
                                action='secondary'
                            >
                                <ButtonIcon as={Minimize2} />
                            </Button>
                            <Button onPress={handleRightButtonPress}
                                action='primary'
                            >
                                <ButtonIcon as={CircleCheck} />
                            </Button>
                        </HStack>
                    </View>

                </Animated.View>
            </VStack>
        </View>
    );
};

export default StopoverCardSwiper;