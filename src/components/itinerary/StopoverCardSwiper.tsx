import { Button, ButtonIcon } from '@/components/ui/button'
import { Center } from '@/components/ui/center'
import { HStack } from '@/components/ui/hstack'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { useToastNotification } from '@/src/hooks/useToastNotification'
import { ItineraryWithStops } from '@/src/model/itinerary.types'
import { supabase } from '@/src/utils/supabase'
import { CircleCheck, CircleX, Minimize2 } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { BackHandler, View } from 'react-native'
import StopOverCard from './StopOverCard'

const StopoverCardSwiper = ({
    onClose,
    refetch,
    showToast,
    stops,
}:
    {
        onClose: () => void,
        stops: ItineraryWithStops['stops'][number][],
        refetch: () => Promise<any>,
        showToast: ReturnType<typeof useToastNotification>['showToast'],
    }
) => {

    const [currentIndex, setCurrentIndex] = useState(0)
    const [haveReachedEnd, setHaveReachedEnd] = useState(false)

    const tryIncrementIndex = () => {
        if (currentIndex < stops.length - 1) {
            setCurrentIndex(prev => prev + 1)
        } else {
            setHaveReachedEnd(true)
        }
    }

    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            onClose()
            return true
        })

        return () => backHandler.remove()
    }, [onClose])


    const currentStop = stops[currentIndex]

    const onSwipeLeft = async () => {
        tryIncrementIndex()
        try {
            const { error } = await supabase.from('stops').delete().eq('id', currentStop.id);
            if (error) throw error;
            await refetch();
            showToast({
                title: "Stop removed.",
                description: "Stop removed successfully.",
                action: 'success'
            });
        } catch (err: any) {
            showToast({
                title: "Something went wrong.",
                description: err.message ?? "Some error happened.",
                action: 'error'
            });
        }
    }

    const onSwipeRight = () => {
        tryIncrementIndex()
    }

    return (
        <View className='flex-1 w-full h-full'>
            <View className='absolute top-0 left-0 w-full h-full bg-black/50' />
            {/* Content */}
            <VStack className='flex-1 w-full h-full p-safe'>
                {
                    haveReachedEnd ? (
                        <Center className='flex-1 w-full h-full'>
                            <VStack className='p-4 size-64 rounded-lg bg-background-0 justify-center items-center' >
                                <Text>All stops swiped</Text>
                            </VStack>
                        </Center>
                    ) : (
                        <>
                            <Center className='flex-1 w-full h-full'>
                                <StopOverCard stop={currentStop} />
                            </Center>
                            <HStack className='p-4 gap-4 justify-between'>
                                <Button onPress={onSwipeLeft}
                                    action='negative'
                                >
                                    <ButtonIcon as={CircleX} />
                                </Button>
                                <Button onPress={onClose}
                                    action='secondary'
                                >
                                    <ButtonIcon as={Minimize2} />
                                </Button>
                                <Button onPress={onSwipeRight}
                                    action='primary'
                                >
                                    <ButtonIcon as={CircleCheck} />
                                </Button>
                            </HStack>
                        </>
                    )
                }


            </VStack>
        </View>
    )
}

export default StopoverCardSwiper