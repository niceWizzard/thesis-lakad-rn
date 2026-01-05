import { Text } from '@/components/ui/text'
import { StorageKey } from '@/src/constants/Key'
import { mmkvStorage } from '@/src/utils/mmkv'
import { useRouter } from 'expo-router'
import React from 'react'
import { TouchableOpacity, View } from 'react-native'

const OnboardingPreferences = () => {

    const router = useRouter()


    function handleDonePress() {
        mmkvStorage.set(StorageKey.HaveOnboarded, true)
        router.replace("/(tabs)")
    }


    return (
        <View style={{
            justifyContent: 'center',
            alignItems: 'center',
            flex: 1,
        }}>
            <Text>Please select your preferences.</Text>

            <TouchableOpacity onPress={handleDonePress}>
                <Text>Done</Text>
            </TouchableOpacity>
        </View>
    )
}

export default OnboardingPreferences    