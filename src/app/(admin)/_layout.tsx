import { Center } from '@/components/ui/center'
import { Text } from '@/components/ui/text'
import { Stack } from 'expo-router'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

const AdminRootLayout = () => {
    return (
        <Stack
            screenOptions={{

            }}
        >
            <Stack.Screen
                name='(tabs)'
                options={{
                    header: () => (
                        <SafeAreaView
                            edges={['top']}
                            className='bg-tertiary-100'
                        >
                            <Center>
                                <Text className='text-typography-900 font-semibold'>Admin mode</Text>
                            </Center>
                        </SafeAreaView>
                    )
                }}
            />
            <Stack.Screen
                name='users/index'
                options={{
                    headerTitle: "User Directory"
                }}
            />

            <Stack.Screen
                name='landmark/[id]/edit'
                options={{
                    headerTitle: "Edit Landmark",

                }}
            />

            <Stack.Screen
                name='landmark/[id]/index'
                options={{
                    headerTitle: "Landmark Management",
                }}
            />

            <Stack.Screen
                name='landmark/create'
                options={{
                    headerTitle: "New Landmark",
                }}
            />

            <Stack.Screen
                name='landmark/archived'
                options={{
                    headerTitle: "Archived Landmarks"
                }}
            />


        </Stack>
    )
}

export default AdminRootLayout