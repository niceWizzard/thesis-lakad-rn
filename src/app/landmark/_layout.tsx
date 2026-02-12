import { Stack } from 'expo-router'
import React from 'react'

const LandmarkLayout = () => {
    return (
        <Stack>
            <Stack.Screen options={{ headerTitle: "View Landmarks" }}
                name='all'
            />
        </Stack>
    )
}

export default LandmarkLayout