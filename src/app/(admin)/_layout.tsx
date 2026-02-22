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
                name='place/[id]/edit'
                options={{
                    headerTitle: "Edit Place",

                }}
            />

            <Stack.Screen
                name='place/[id]/info'
                options={{
                    headerTitle: "Place Management",
                }}
            />

            <Stack.Screen
                name='place/create'
                options={{
                    headerTitle: "New Place",
                }}
            />

            <Stack.Screen
                name='place/archived-places'
                options={{
                    headerTitle: "Archived Places"
                }}
            />
            <Stack.Screen
                name='place/matrix'
                options={{
                    headerTitle: ''
                }}
            />

        </Stack>
    )
}

export default AdminRootLayout