import { Stack } from 'expo-router'
import React from 'react'

const AuthLayout = () => {
    return (
        <Stack>
            <Stack.Screen
                name='signin'
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name='signup'
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name='forgot'
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name='reset-password'
                options={{
                    headerShown: false,
                }}
            />
        </Stack>
    )
}

export default AuthLayout 