import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";

const ItinerarySkeleton = () => (
    <Box className="bg-background-50 rounded-3xl border border-outline-100 p-5 mb-6 overflow-hidden">
        <HStack className="justify-between items-start mb-4">
            <VStack className="flex-1 pr-4 gap-2">
                <Box className="w-20 h-4 bg-background-200 rounded-md" />
                <Box className="w-40 h-8 bg-background-200 rounded-md" />
            </VStack>
            <Box className="w-8 h-8 bg-background-200 rounded-full" />
        </HStack>

        <VStack className="mb-6 gap-3">
            <Box className="w-24 h-4 bg-background-200 rounded-md" />
            <Box className="w-full h-3 bg-background-100 rounded-full" />
        </VStack>

        <VStack className="bg-background-0 rounded-2xl p-4 border border-outline-50 gap-4 mb-5">
            {[1, 2].map((i) => (
                <HStack key={i} className="items-center gap-3">
                    <Box className="w-5 h-5 bg-background-200 rounded-full" />
                    <Box className="w-3/4 h-4 bg-background-200 rounded-md" />
                </HStack>
            ))}
        </VStack>

        <Box className="w-full h-14 bg-background-200 rounded-2xl" />
    </Box>
);

export default ItinerarySkeleton