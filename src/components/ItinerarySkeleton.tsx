import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { useEffect } from 'react';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';

const AnimatedBox = Animated.createAnimatedComponent(Box);

const SkeletonBox = ({ className, ...props }: React.ComponentProps<typeof Box>) => {
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
    }, [opacity]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return <AnimatedBox className={className} style={animatedStyle} {...props} />;
};

const ItinerarySkeleton = () => (
    <Box className="bg-background-50 rounded-3xl border border-outline-100 p-5 mb-6 overflow-hidden">
        <HStack className="justify-between items-start mb-6">
            <VStack className="flex-1 pr-4 gap-2">
                {/* Date */}
                <SkeletonBox className="w-24 h-3 bg-background-200 rounded-md" />
                {/* Name */}
                <SkeletonBox className="w-48 h-7 bg-background-200 rounded-md" />
                {/* Stats */}
                <HStack className="gap-3 mt-1">
                    <SkeletonBox className="w-16 h-3 bg-background-200 rounded-md" />
                    <SkeletonBox className="w-16 h-3 bg-background-200 rounded-md" />
                </HStack>
            </VStack>
            <SkeletonBox className="w-8 h-8 bg-background-200 rounded-full" />
        </HStack>

        {/* Stops Preview Skeleton */}
        <VStack className="mb-6 gap-2 bg-background-100/50 p-3 rounded-xl">
            {[1, 2, 3].map((i) => (
                <HStack key={i} className="items-center gap-3">
                    <SkeletonBox className="w-2 h-2 bg-background-200 rounded-full" />
                    <SkeletonBox className="w-3/4 h-3 bg-background-200 rounded-md" />
                </HStack>
            ))}
        </VStack>

        {/* Progress */}
        <VStack className="mb-6 gap-2">
            <HStack className="justify-between">
                <SkeletonBox className="w-16 h-3 bg-background-200 rounded-md" />
                <SkeletonBox className="w-8 h-3 bg-background-200 rounded-md" />
            </HStack>
            <SkeletonBox className="w-full h-2 bg-background-200 rounded-full" />
        </VStack>

        {/* Button */}
        <SkeletonBox className="w-full h-14 bg-background-200 rounded-2xl" />
    </Box>
);

export default ItinerarySkeleton;