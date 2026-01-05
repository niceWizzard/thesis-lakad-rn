import { Text } from '@/components/ui/text'
import { useRouter } from 'expo-router'
import React from 'react'
import { TouchableOpacity, View } from 'react-native'

const OnboardingScreen = () => {

    const router = useRouter()

    function handleContinuePress() {
        router.navigate("/(onboarding)/preferences")
    }

    return (
        <View style={{
            justifyContent: 'center',
            alignItems: 'center',
            flex: 1,
        }}>
            <Text size='lg'>Welcome to Lakad</Text>
            <Text size='sm'>A smart way to traverse your itineraries</Text>
            <TouchableOpacity onPress={handleContinuePress}>
                <Text>Continue</Text>
            </TouchableOpacity>
        </View>
    )
}

export default OnboardingScreen 