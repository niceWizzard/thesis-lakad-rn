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
        <View className='w-96 h-[400px] rounded-lg bg-background-0'>
            {
                landmark.image_url && (
                    <Image
                        source={{ uri: landmark.image_url }}
                        className='w-full h-48 rounded-t-lg'
                    />
                )
            }
            <VStack
                className='p-3 gap-3 '
            >
                <Heading >{landmark.name}</Heading>
                <HStack >
                    <Badge>
                        <BadgeText>{landmark.type}</BadgeText>
                    </Badge>
                </HStack>
                <Text >{landmark.description}</Text>
            </VStack>
        </View>
    )
}

export default StopOverCard