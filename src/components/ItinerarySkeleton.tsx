import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";

const ItinerarySkeleton = () => (
    <Box className="bg-background-50 rounded-3xl border border-outline-100 p-5 mb-6 overflow-hidden">
        <HStack className="justify-between items-start mb-6">
            <VStack className="flex-1 pr-4 gap-2">
                {/* Date */}
                <Box className="w-24 h-3 bg-background-200 rounded-md" />
                {/* Name */}
                <Box className="w-48 h-7 bg-background-200 rounded-md" />
                {/* Stats */}
                <HStack className="gap-3 mt-1">
                    <Box className="w-16 h-3 bg-background-200 rounded-md" />
                    <Box className="w-16 h-3 bg-background-200 rounded-md" />
                </HStack>
            </VStack>
            <Box className="w-8 h-8 bg-background-200 rounded-full" />
        </HStack>

        {/* Stops Preview Skeleton */}
        <VStack className="mb-6 gap-2 bg-background-100/50 p-3 rounded-xl">
            {[1, 2, 3].map((i) => (
                <HStack key={i} className="items-center gap-3">
                    <Box className="w-2 h-2 bg-background-200 rounded-full" />
                    <Box className="w-3/4 h-3 bg-background-200 rounded-md" />
                </HStack>
            ))}
        </VStack>

        {/* Progress */}
        <VStack className="mb-6 gap-2">
            <HStack className="justify-between">
                <Box className="w-16 h-3 bg-background-200 rounded-md" />
                <Box className="w-8 h-3 bg-background-200 rounded-md" />
            </HStack>
            <Box className="w-full h-2 bg-background-200 rounded-full" />
        </VStack>

        {/* Button */}
        <Box className="w-full h-14 bg-background-200 rounded-2xl" />
    </Box>
);

export default ItinerarySkeleton