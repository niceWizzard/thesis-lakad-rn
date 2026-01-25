import { Box } from '@/components/ui/box'
import { Text } from '@/components/ui/text'
import { MarkerView } from '@rnmapbox/maps'
import React from 'react'
import { Image } from 'react-native'
import { Pressable } from 'react-native-gesture-handler'
import { Landmark } from '../model/landmark.types'

const LandmarkMarker = ({ landmark, handleMarkerPress, isSelected = false }: {
    landmark: Landmark,
    handleMarkerPress?: (landmark: Landmark) => void,
    isSelected?: boolean
}) => {
    return (
        <MarkerView
            key={landmark.id}
            coordinate={[landmark.longitude, landmark.latitude]}
            anchor={{ x: 0.5, y: 1 }}
            allowOverlapWithPuck
            isSelected={isSelected}
        >
            <Pressable onPress={() => handleMarkerPress?.(landmark)}
                style={{ alignItems: 'center' }}
            >
                {/* Avatar Container */}
                <Box
                    style={{ elevation: 5 }}
                    className={`p-1 bg-white rounded-full shadow-lg
                                    ${isSelected ? 'border border-primary-500' : ''}`}
                >
                    <Image
                        source={{ uri: landmark.image_url || "https://via.placeholder.com/150" }}
                        style={{ width: 32, height: 32, borderRadius: 22 }}
                    />
                </Box>

                {/* The "Pointer" Triangle */}
                <Box
                    className="bg-primary-500"
                    style={{
                        width: 12,
                        height: 12,
                        transform: [{ rotate: '45deg' }],
                        marginTop: -6,
                        zIndex: -1
                    }} />

                {/* Label with better padding */}
                <Box className="mt-1 bg-background-100 px-2 py-0.5 rounded-full border border-outline-100 shadow-sm max-w-24">
                    <Text size="xs" numberOfLines={1} className="font-semibold text-typography-900">
                        {landmark.name}
                    </Text>
                </Box>
            </Pressable>
        </MarkerView>
    )
}

export default LandmarkMarker