import { Text } from '@/components/ui/text'
import { StorageKey } from '@/src/constants/Key'
import { mmkvStorage } from '@/src/utils/mmkv'
import { useRouter } from 'expo-router'
import React from 'react'
import { TouchableOpacity, View } from 'react-native'
import { useMMKVBoolean } from 'react-native-mmkv'

const OnboardingScreen = () => {

    const router = useRouter()
    const [b, setB] = useMMKVBoolean(StorageKey.HaveOnboarded, mmkvStorage)


    function handleContinuePress() {
        mmkvStorage.set(StorageKey.HaveOnboarded, true)
        router.replace("/(tabs)")
    }

    return (
        <View style={{
            justifyContent: 'center',
            alignItems: 'center',
            flex: 1,
        }}>
            <Text>You are in onboarding screen {b ? "onbaorded" : "none"}</Text>
            <TouchableOpacity onPress={handleContinuePress}>
                <Text>Continue</Text>
            </TouchableOpacity>
        </View>
    )
}

export default OnboardingScreen 