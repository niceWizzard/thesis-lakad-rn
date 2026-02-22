import { Stack } from 'expo-router'
import React from 'react'

const ProfileLayout = () => {
    return (
        <Stack screenOptions={{
            headerShown: false,
        }} >
            <Stack.Screen
                name="setup"
                options={{
                }}
            />
            <Stack.Screen
                name="settings"
                options={{
                    headerTitle: "Account Settings",
                    headerShown: true,
                }}
            />
            <Stack.Screen
                name="my-reviews"
                options={{ headerTitle: "My Reviews", headerShown: true }}
            />
        </Stack>
    )
}

export default ProfileLayout