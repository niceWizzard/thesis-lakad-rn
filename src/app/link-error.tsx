import { Text } from '@/components/ui/text';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';


const LinkErrorScreen = () => {

    const router = useRouter()

    const deepLinkUrl = Linking.useLinkingURL()

    const errorMessage = deepLinkUrl

    return (
        <View className='flex-1 justify-center items-center p-4'>
            <Text size='2xl' className='mb-4'>Something went wrong</Text>
            <Text>{errorMessage}</Text>
        </View>
    )
}

export default LinkErrorScreen