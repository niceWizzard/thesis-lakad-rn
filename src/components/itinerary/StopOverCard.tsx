import { Badge, BadgeText } from '@/components/ui/badge'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { ItineraryWithStops } from '@/src/model/itinerary.types'
import React from 'react'
import { Image, View } from 'react-native'

const StopOverCard = ({ stop }: {
    stop: ItineraryWithStops['stops'][number],

}) => {
    const landmark = stop.landmark
    return (
        <View className='w-96 h-[400px] rounded-lg bg-background-0 overflow-hidden'>
            {
                landmark.image_url && (
                    <Image
                        source={{ uri: landmark.image_url }}
                        className='w-full h-48'
                    />
                )
            }
            <VStack
                className='p-4 gap-2 h-full'
            >
                <Heading size='md' numberOfLines={1}>{landmark.name}</Heading>

                <HStack className='items-center gap-2'>
                    <Badge size='sm' variant='solid' action='info'>
                        <BadgeText>{landmark.type}</BadgeText>
                    </Badge>
                    <Text size='xs' className='text-typography-500'>
                        {landmark.district}, {landmark.municipality}
                    </Text>
                </HStack>

                <Text className='text-sm text-typography-600 mt-2' numberOfLines={5} ellipsizeMode='tail'>
                    {landmark.description}
                </Text>
            </VStack>
        </View>
    )
}

export default StopOverCard