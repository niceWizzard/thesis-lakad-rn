import { Button, ButtonText } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { StorageKey } from '@/src/constants/Key'
import { LandmarkType } from '@/src/model/landmark.types'
import { mmkvStorage } from '@/src/utils/mmkv'
import { getCategoryPreferences, setCategoryPreferences } from '@/src/utils/preferencesManager'
import { Stack, useRouter } from 'expo-router'
import {
    Check,
    Church,
    History,
    Landmark,
    Library,
    ShoppingBag,
    Trees
} from "lucide-react-native"
import React, { useEffect, useState } from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
export const TYPES: {
    id: LandmarkType,
    label: string,
    icon: React.FC<any>,
    color: string,
    text: string
}[] = [
        { id: 'Historical', label: 'Historical', icon: History, color: 'bg-green-100', text: 'text-green-700' },
        { id: 'Landmark', label: 'Landmark', icon: Landmark, color: 'bg-green-100', text: 'text-green-700' },
        { id: 'Nature', label: 'Nature', icon: Trees, color: 'bg-green-100', text: 'text-green-700' },
        { id: 'Religious', label: 'Religious', icon: Church, color: 'bg-green-100', text: 'text-green-700' },
        { id: 'Museum', label: 'Museum', icon: Library, color: 'bg-green-100', text: 'text-green-700' },
        { id: 'Mall', label: 'Mall', icon: ShoppingBag, color: 'bg-green-100', text: 'text-green-700' },
    ];

const OnboardingPreferences = () => {
    const router = useRouter()
    const [selected, setSelected] = useState<string[]>([])

    useEffect(() => {
        setSelected(
            getCategoryPreferences()
        )
    }, [])

    const toggleCategory = (id: string) => {
        if (selected.includes(id)) {
            setSelected(selected.filter((item) => item !== id))
        } else {
            setSelected([...selected, id])
        }
    }

    const handleDonePress = () => {
        mmkvStorage.set(StorageKey.HaveOnboarded, true)
        setCategoryPreferences(selected)
        if (router.canGoBack())
            router.back()
        else
            router.replace("/(auth)/signin")
    }

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: router.canGoBack()
                }}
            />
            <SafeAreaView className="flex-1 bg-background-0">
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 py-8">

                    {/* Header */}
                    <View className="mb-8">
                        <Heading size="3xl" className="text-typography-900 mb-2">Personalize</Heading>
                        <Text size="lg" className="text-typography-600">
                            Select at least 3 types that interest you to help us tailor your itineraries.
                        </Text>
                    </View>

                    {/* Grid of Types */}
                    <View className="flex-row flex-wrap justify-between gap-y-4 pb-16">
                        {TYPES.map((item) => {
                            const isSelected = selected.includes(item.id)

                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    activeOpacity={0.8}
                                    onPress={() => toggleCategory(item.id)}
                                    style={{ width: '48%' }} // Two columns
                                    className={`
                                    p-5 rounded-3xl border-2 items-center justify-center relative
                                    ${isSelected
                                            ? 'border-primary-600 bg-primary-0'
                                            : 'border-outline-100 bg-background-50'}
                                `}
                                >
                                    {/* Selection Indicator (Checkmark) */}
                                    {isSelected && (
                                        <View className="absolute top-3 right-3 bg-primary-600 rounded-full p-0.5">
                                            <Check size={12} color="white" strokeWidth={4} />
                                        </View>
                                    )}

                                    <View className={`${item.color} p-4 rounded-2xl mb-3`}>
                                        <item.icon size={28} className={item.text} />
                                    </View>

                                    <Text size="md" className={`font-bold ${isSelected ? 'text-primary-600' : 'text-typography-700'}`}>
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            )
                        })}
                    </View>

                    {/* Bottom Spacer for Scroll */}
                    <View className="h-20" />
                </ScrollView>

                {/* Sticky Footer Button */}
                <View className="absolute bottom-0 left-0 right-0 p-6 bg-background-0 border-t border-outline-50">
                    <Button
                        size="lg"
                        className="rounded-2xl h-14"
                        onPress={handleDonePress}
                        isDisabled={selected.length < 3}
                        action={selected.length < 3 ? 'secondary' : 'primary'}
                    >
                        <ButtonText className="font-bold">
                            {selected.length < 3
                                ? `Select ${3 - selected.length} more`
                                : router.canGoBack() ? "Save" : 'Get Started'}
                        </ButtonText>
                    </Button>
                </View>
            </SafeAreaView>
        </>
    )
}

export default OnboardingPreferences