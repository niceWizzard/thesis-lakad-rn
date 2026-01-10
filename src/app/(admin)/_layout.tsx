import { Center } from '@/components/ui/center'
import { Text } from '@/components/ui/text'
import { Stack } from 'expo-router'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

const AdminRootLayout = () => {
    return (
        <Stack
            screenOptions={{
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
        >
            <Stack.Screen
                name='(tabs)'
                options={{

                }}
            />
        </Stack>
    )
}

export default AdminRootLayout