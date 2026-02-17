import { Stack } from 'expo-router'
import React from 'react'

const PasalubongLayout = () => {
    return (
        <Stack >
            <Stack.Screen name="[id]/index" options={{ headerTitle: '' }} />
            <Stack.Screen name="[id]/edit" options={{ headerTitle: '' }} />
        </Stack>
    )
}

export default PasalubongLayout