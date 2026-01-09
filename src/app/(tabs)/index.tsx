import { Text } from '@/components/ui/text'
import { useLandmarkStore } from '@/src/stores/useLandmarkStore'
import React from 'react'
import { View } from 'react-native'

const HomeTab = () => {
    const landmarks = useLandmarkStore(v => v.landmarks)
    return (
        <View>
            {
                landmarks.map(l => {
                    return (
                        <Text key={l.id}>{l.name}</Text>
                    )
                })
            }
        </View>
    )
}

export default HomeTab