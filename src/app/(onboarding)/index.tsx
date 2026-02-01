import { Button, ButtonIcon, ButtonText } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { StorageKey } from '@/src/constants/Key'
import { mmkvStorage } from '@/src/utils/mmkv'
import { useRouter } from 'expo-router'
import { ArrowRight, Calendar, MapPin, Rocket } from 'lucide-react-native'
import React, { useRef, useState } from 'react'
import { Animated, FlatList, useWindowDimensions, View } from 'react-native'

const SLIDES = [
    {
        id: '1',
        title: 'Welcome to Lakad',
        description: 'A smart way to traverse and manage your travel itineraries with ease.',
        icon: MapPin,
        color: 'bg-primary-500'
    },
    {
        id: '2',
        title: 'Stay Organized',
        description: 'Sync your schedules and never miss a landmark or a flight again.',
        icon: Calendar,
        color: 'bg-success-500'
    },
    {
        id: '3',
        title: 'Start Exploring',
        description: 'Join thousands of travelers making their journeys smarter every day.',
        icon: Rocket,
        color: 'bg-secondary-500'
    }
]

const OnboardingScreen = () => {
    const router = useRouter()
    const { width } = useWindowDimensions()
    const [currentIndex, setCurrentIndex] = useState(0)
    const scrollX = useRef(new Animated.Value(0)).current
    const slidesRef = useRef<FlatList>(null)

    const viewableItemsChanged = useRef(({ viewableItems }: any) => {
        setCurrentIndex(viewableItems[0].index)
    }).current

    const handleNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            slidesRef.current?.scrollToIndex({ index: currentIndex + 1 })
        } else {
            router.replace("/(onboarding)/preferences")
        }
    }

    const handleSkip = () => {
        mmkvStorage.set(StorageKey.HaveOnboarded, true)
        router.navigate("/(onboarding)/preferences")
    }

    return (
        <View className="flex-1 bg-background-0">
            {/* 1. The Carousel */}
            <FlatList
                data={SLIDES}
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                bounces={false}
                keyExtractor={(item) => item.id}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                    useNativeDriver: false,
                })}
                onViewableItemsChanged={viewableItemsChanged}
                ref={slidesRef}
                renderItem={({ item }) => (
                    <View style={{ width }} className="flex-1 justify-center items-center px-10">
                        <View className={`${item.color} p-8 rounded-full mb-10 shadow-soft-2`}>
                            <item.icon size={80} color="white" />
                        </View>
                        <Heading size="3xl" className="text-center text-typography-900 mb-4">
                            {item.title}
                        </Heading>
                        <Text size="lg" className="text-center text-typography-600">
                            {item.description}
                        </Text>
                    </View>
                )}
            />

            {/* 2. Pagination & Footer */}
            <View className="pb-16 px-10">
                {/* Pagination Dots */}
                <View className="flex-row justify-center gap-2 mb-10">
                    {SLIDES.map((_, i) => {
                        const dotWidth = scrollX.interpolate({
                            inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                            outputRange: [10, 24, 10],
                            extrapolate: 'clamp',
                        })
                        const opacity = scrollX.interpolate({
                            inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                            outputRange: [0.3, 1, 0.3],
                            extrapolate: 'clamp',
                        })
                        return (
                            <Animated.View
                                key={i}
                                style={{ width: dotWidth, opacity }}
                                className="h-2.5 rounded-full bg-primary-600"
                            />
                        )
                    })}
                </View>

                {/* Navigation Buttons */}
                <View className="flex-row items-center justify-between">
                    <Button
                        variant="link"
                        onPress={handleSkip}
                    >
                        <ButtonText className="text-typography-400">Skip</ButtonText>
                    </Button>

                    <Button
                        size="lg"
                        className="rounded-full px-8"
                        onPress={handleNext}
                    >
                        <ButtonText className="font-bold">
                            {currentIndex === SLIDES.length - 1 ? "Get Started" : "Next"}
                        </ButtonText>
                        <ButtonIcon as={ArrowRight} className="ml-2" />
                    </Button>
                </View>
            </View>
        </View>
    )
}

export default OnboardingScreen