import { Button, ButtonText } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { StorageKey } from '@/src/constants/Key'
import { mmkvStorage } from '@/src/utils/mmkv'
import { Stack, useRouter } from 'expo-router'
import {
    Camera,
    Check,
    History,
    Mountain,
    Music,
    Palmtree,
    ShoppingBag,
    Utensils
} from 'lucide-react-native'
import React, { useState } from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

// 1. Define the categories
const CATEGORIES = [
    { id: 'nature', label: 'Nature', icon: Palmtree, color: 'bg-green-100', text: 'text-green-700' },
    { id: 'food', label: 'Foodie', icon: Utensils, color: 'bg-orange-100', text: 'text-orange-700' },
    { id: 'culture', label: 'Culture', icon: History, color: 'bg-amber-100', text: 'text-amber-700' },
    { id: 'nightlife', label: 'Nightlife', icon: Music, color: 'bg-purple-100', text: 'text-purple-700' },
    { id: 'adventure', label: 'Adventure', icon: Mountain, color: 'bg-blue-100', text: 'text-blue-700' },
    { id: 'photography', label: 'Photo', icon: Camera, color: 'bg-pink-100', text: 'text-pink-700' },
    { id: 'shopping', label: 'Shopping', icon: ShoppingBag, color: 'bg-slate-100', text: 'text-slate-700' },
]

const OnboardingPreferences = () => {
    const router = useRouter()
    const [selected, setSelected] = useState<string[]>([])

    const toggleCategory = (id: string) => {
        if (selected.includes(id)) {
            setSelected(selected.filter((item) => item !== id))
        } else {
            setSelected([...selected, id])
        }
    }

    const handleDonePress = () => {
        // You could also save the 'selected' array to MMKV or Supabase here
        mmkvStorage.set(StorageKey.HaveOnboarded, true)
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
                            Select at least 3 categories that interest you to help us tailor your itineraries.
                        </Text>
                    </View>

                    {/* Grid of Categories */}
                    <View className="flex-row flex-wrap justify-between gap-y-4">
                        {CATEGORIES.map((item) => {
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
                                : 'Get Started'}
                        </ButtonText>
                    </Button>
                </View>
            </SafeAreaView>
        </>
    )
}

export default OnboardingPreferences