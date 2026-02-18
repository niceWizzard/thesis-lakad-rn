import { Badge, BadgeText } from '@/components/ui/badge'
import { Center } from '@/components/ui/center'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { ItineraryWithStops } from '@/src/model/itinerary.types'
import { ImageOff } from 'lucide-react-native'
import React from 'react'
import { Image, View, useWindowDimensions } from 'react-native'

const StopOverCard = ({ stop }: {
    stop: ItineraryWithStops['stops'][number],

}) => {
    const { width, height } = useWindowDimensions();
    const cardWidth = Math.min(width * 0.90, 400);
    const cardHeight = Math.min(height * 0.60, 600);

    const landmark = stop.landmark
    return (
        <View
            style={{ width: cardWidth, height: cardHeight }}
            className='rounded-3xl bg-background-0 overflow-hidden shadow-sm'
        >
            {
                landmark.image_url ? (
                    <Image
                        source={{ uri: landmark.image_url }}
                        className='w-full h-[45%]'
                    />
                ) : (
                    <Center className='w-full h-[45%] bg-white'>
                        <ImageOff size={48} color='#d1d5db' />
                    </Center>
                )
            }
            <VStack
                className='p-4 gap-2 flex-1'
            >
                <Heading size='lg' >{landmark.name}</Heading>

                <HStack className='items-center gap-2'>
                    <Badge size='lg' variant='solid' action='info'>
                        <BadgeText>{landmark.type}</BadgeText>
                    </Badge>
                    <Text size='md' className='text-typography-500'>
                        District {landmark.district} - {landmark.municipality}
                    </Text>
                </HStack>

                <Text className='mt-2' size='md' ellipsizeMode='tail' numberOfLines={8}>
                    {landmark.description || "No description available"}
                </Text>
            </VStack>
        </View>
    )
}

export default StopOverCard